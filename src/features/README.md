# ROUTENEX · Feature modules

Each folder maps to a module in the ROUTENEX blueprint. Feature code stays inside its module;
shared behaviour lives in `src/services`, `src/lib` and `src/components/common`.

| Folder         | Blueprint module                            |
| -------------- | ------------------------------------------- |
| `student`      | A. Student management                       |
| `provider`     | B. Transportation management (provider side) |
| `journey`      | C. Intelligent journey planning             |
| `pooling`      | D. Smart student pooling                    |
| `assistant`    | E. AI intelligence                          |
| `disruptions`  | B + F. Disruption reports and verification  |
| `admin`        | G. Administrator and analytics             |
| `analytics`    | G. Demand, capacity and connectivity views  |

Planned internal shape for a feature:

```
features/<module>/
├── components/     module-specific UI
├── hooks/          module-specific hooks
├── services/       module-specific data access (shared services go in src/services)
├── constants.js    labels, thresholds, enums
└── index.js        public surface of the module
```

Modules must consume the shared transport data layer rather than keeping their own copies.
