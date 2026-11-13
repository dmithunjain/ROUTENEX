import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import ProviderProfile from '../models/ProviderProfile.js';
import Village from '../models/Village.js';
import { generateTokens, verifyRefreshToken } from '../middleware/auth.js';
import { asyncHandler, BadRequestError, UnauthorizedError, ConflictError, NotFoundError } from '../middleware/errorHandler.js';
import { formatResponse } from '../utils/helpers.js';
import crypto from 'crypto';

export const register = asyncHandler(async (req, res) => {
  const { role, name, email, phone, password, villageId, college } = req.body;
  
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ConflictError('An account with this email already exists');
  }
  
  if (role === 'admin') {
    throw new BadRequestError('Administrator accounts are created by the platform team');
  }
  
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase(),
    phone: phone?.trim(),
    password,
    role
  });
  
  let profile;
  if (role === 'student') {
    const defaultVillage = villageId || (await Village.findOne())._id;
    profile = await StudentProfile.create({
      user: user._id,
      college: college?.trim() || 'Govt. Arts & Science College, Uthiramerur',
      village: defaultVillage,
      departurePreference: '08:00',
      budget: 50
    });
  } else if (role === 'provider') {
    const defaultVillage = villageId || (await Village.findOne())._id;
    profile = await ProviderProfile.create({
      user: user._id,
      type: 'ev',
      contact: name.trim(),
      verified: false,
      available: true,
      serviceAreas: defaultVillage ? [defaultVillage] : []
    });
  }
  
  const { accessToken, refreshToken } = generateTokens(user);
  
  res.cookie('token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
  
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000
  });
  
  res.status(201).json(formatResponse(true, {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profile
    },
    accessToken,
    refreshToken
  }, 'Account created successfully'));
});

export const login = asyncHandler(async (req, res) => {
  const { role, email, password } = req.body;
  
  if (!email || !password) {
    throw new BadRequestError('Email and password are required');
  }
  
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  
  if (!user) {
    throw new UnauthorizedError('Invalid credentials');
  }
  
  if (user.role !== role) {
    throw new UnauthorizedError(`No ${role} account found with this email`);
  }
  
  if (!user.isActive) {
    throw new UnauthorizedError('Account is deactivated');
  }
  
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new UnauthorizedError('Invalid credentials');
  }
  
  user.lastLogin = new Date();
  await user.save();
  
  const { accessToken, refreshToken } = generateTokens(user);
  
  let profile = null;
  if (role === 'student') {
    profile = await StudentProfile.findOne({ user: user._id })
      .populate('village')
      .populate('homeStop');
  } else if (role === 'provider') {
    profile = await ProviderProfile.findOne({ user: user._id })
      .populate('serviceAreas');
  }
  
  res.cookie('token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
  
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000
  });
  
  res.json(formatResponse(true, {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profile
    },
    accessToken,
    refreshToken
  }, 'Login successful'));
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie('token');
  res.clearCookie('refreshToken');
  
  res.json(formatResponse(true, null, 'Logged out successfully'));
});

export const refreshToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
  
  if (!refreshToken) {
    throw new UnauthorizedError('Refresh token required');
  }
  
  const decoded = verifyRefreshToken(refreshToken);
  if (!decoded) {
    throw new UnauthorizedError('Invalid refresh token');
  }
  
  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) {
    throw new UnauthorizedError('User not found or inactive');
  }
  
  const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);
  
  res.cookie('token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
  
  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000
  });
  
  res.json(formatResponse(true, { accessToken, refreshToken: newRefreshToken }, 'Token refreshed'));
});

export const getMe = asyncHandler(async (req, res) => {
  let profile = null;
  if (req.user.role === 'student') {
    profile = await StudentProfile.findOne({ user: req.user._id })
      .populate('village')
      .populate('homeStop');
  } else if (req.user.role === 'provider') {
    profile = await ProviderProfile.findOne({ user: req.user._id })
      .populate('serviceAreas');
  }
  
  res.json(formatResponse(true, {
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      phone: req.user.phone,
      isEmailVerified: req.user.isEmailVerified,
      profile
    }
  }));
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, college, villageId, departurePreference, budget, emergencyContact, serviceAreas } = req.body;
  
  if (req.user.role === 'student') {
    const profile = await StudentProfile.findOneAndUpdate(
      { user: req.user._id },
      {
        college,
        village: villageId,
        departurePreference,
        budget,
        emergencyContact
      },
      { new: true, runValidators: true }
    ).populate('village');
    
    if (name || phone) {
      await User.findByIdAndUpdate(req.user._id, { name, phone });
    }
    
    res.json(formatResponse(true, profile, 'Profile updated'));
  } else if (req.user.role === 'provider') {
    const profile = await ProviderProfile.findOneAndUpdate(
      { user: req.user._id },
      {
        contact: name,
        phone,
        serviceAreas
      },
      { new: true, runValidators: true }
    ).populate('serviceAreas');
    
    if (name || phone) {
      await User.findByIdAndUpdate(req.user._id, { name, phone });
    }
    
    res.json(formatResponse(true, profile, 'Profile updated'));
  } else {
    if (name || phone) {
      const user = await User.findByIdAndUpdate(
        req.user._id,
        { name, phone },
        { new: true }
      );
      res.json(formatResponse(true, user, 'Profile updated'));
    }
  }
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    throw new BadRequestError('Current and new password are required');
  }
  
  if (newPassword.length < 6) {
    throw new BadRequestError('New password must be at least 6 characters');
  }
  
  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.comparePassword(currentPassword);
  
  if (!isMatch) {
    throw new UnauthorizedError('Current password is incorrect');
  }
  
  user.password = newPassword;
  await user.save();
  
  res.json(formatResponse(true, null, 'Password changed successfully'));
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.json(formatResponse(true, null, 'If the email exists, a reset link will be sent'));
  }
  
  const resetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  await user.save();
  
  console.log(`Password reset token for ${email}: ${resetToken}`);
  
  res.json(formatResponse(true, null, 'If the email exists, a reset link will be sent'));
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });
  
  if (!user) {
    throw new BadRequestError('Invalid or expired reset token');
  }
  
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  
  res.json(formatResponse(true, null, 'Password reset successful'));
});