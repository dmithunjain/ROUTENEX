import LegalDoc from '@/components/common/LegalDoc'
import { APP } from '@/constants/app'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

const SECTIONS = [
  {
    id: 'information-we-collect',
    heading: 'Information we collect',
    paragraphs: [
      'ROUTENEX collects only the information needed to plan rural journeys, match students into shared rides and let transport providers act on requests.',
    ],
    list: [
      'Account details: name, email address, mobile number and password.',
      'Student profile: home village, college, preferred departure time, travel budget and an optional emergency contact.',
      'Travel activity: journey searches, saved journeys, pooling groups, ride requests and their status history.',
      'Provider records: business name, service village, contact details, vehicle registrations and seat capacity.',
      'Support messages you submit through the contact form.',
    ],
  },
  {
    id: 'how-we-use-information',
    heading: 'How we use information',
    paragraphs: [
      'Your information is used to operate the platform and nothing else. Specifically, we use it to build journey options, calculate estimated fares, match students travelling the same way, show a request to the relevant provider and keep administrators informed about the network.',
    ],
    list: [
      'To generate bus, walking and community EV journey options for your route.',
      'To match pooling groups by nearby origin, destination and departure window.',
      'To send ride requests to the provider who can actually serve them.',
      'To let administrators verify providers, maintain schedules and respond to cancellations.',
    ],
  },
  {
    id: 'sharing',
    heading: 'When information is shared',
    paragraphs: [
      'Students and providers only see what a request requires. A provider receives the pickup stop, destination and seat count for a request they can serve — never your password or unrelated journey history.',
      'We do not sell personal information and we do not share it with advertising networks.',
    ],
  },
  {
    id: 'storage',
    heading: 'Where data is stored',
    paragraphs: [
      'In this demonstration build, account sessions and transport records are stored in your own browser using local storage. Nothing is transmitted to a ROUTENEX server because this build has no backend.',
      'A production deployment would move accounts, requests and provider verification to a managed database with server-side authentication and audit logging.',
    ],
  },
  {
    id: 'retention',
    heading: 'Retention and deletion',
    paragraphs: [
      'Clearing your browser data removes every record created in this demo. In a production deployment you would be able to request account deletion from your dashboard, and journey records would be retained only as long as required for operational and accounting purposes.',
    ],
  },
  {
    id: 'security',
    heading: 'Security',
    paragraphs: [
      'Role-based screens keep student, provider and administrator tools separate, and portal routes require a signed-in session. However, because this demo authenticates in the browser, its credentials are not a secure production control.',
      'Before handling real student data, ROUTENEX would require server-side authentication, encrypted transport, hashed passwords and audited administrator actions.',
    ],
  },
  {
    id: 'third-parties',
    heading: 'Third-party services',
    paragraphs: [
      'The homepage shows live weather for the Uthiramerur hub using the Open-Meteo public API. That request is made directly from your browser and includes only coordinates and a timezone — no personal information.',
    ],
  },
  {
    id: 'your-choices',
    heading: 'Your choices',
    list: [
      'You can edit your student profile details from the student dashboard.',
      'You can cancel or stop participating in a pooling group before a provider accepts it.',
      'You can sign out at any time, which clears the session from this browser.',
      'You can contact support to correct or remove information.',
    ],
  },
  {
    id: 'contact',
    heading: 'Contact us',
    paragraphs: [
      `For privacy questions, contact ${APP.supportEmail} or call ${APP.supportPhone}. Our office is at ${APP.address}.`,
    ],
  },
]

export default function PrivacyPage() {
  useDocumentTitle('Privacy Policy')

  return (
    <LegalDoc
      title="Privacy Policy"
      updated="13 November 2026"
      intro="ROUTENEX handles student and provider information so that rural journeys can be planned, shared and operated. This policy explains what we collect, why we collect it and the choices you have."
      sections={SECTIONS}
    />
  )
}
