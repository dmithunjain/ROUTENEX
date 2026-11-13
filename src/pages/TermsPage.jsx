import LegalDoc from '@/components/common/LegalDoc'
import { APP } from '@/constants/app'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

const SECTIONS = [
  {
    id: 'acceptance',
    heading: 'Acceptance of these terms',
    paragraphs: [
      'By creating a ROUTENEX account or using a ROUTENEX portal you agree to these terms. If you do not agree, please do not use the platform.',
      'Student accounts are intended for learners travelling to and from colleges in the served districts. Provider accounts are intended for licensed local transport operators. Administrator accounts are issued by the ROUTENEX team.',
    ],
  },
  {
    id: 'accounts',
    heading: 'Accounts and access',
    list: [
      'You must provide accurate details and keep your login credentials private.',
      'One person should not maintain multiple student accounts.',
      'Administrator accounts are never self-registered and remain the responsibility of the platform team.',
      'You must be old enough to enter into a service agreement in your jurisdiction, or have permission from a parent or guardian.',
    ],
  },
  {
    id: 'sample-data',
    heading: 'Demonstration data and estimates',
    paragraphs: [
      'This build uses clearly labelled sample transport records. Routes, stops, schedules, seat counts, fares and provider availability are illustrative and are not live transport information from any operator.',
      'Journey times and fares are estimates only. Always confirm departure details with the operator before travelling, and never rely on the platform in an emergency.',
    ],
  },
  {
    id: 'provider-obligations',
    heading: 'Transport provider obligations',
    list: [
      'Hold a valid licence, registration and insurance for every vehicle you list.',
      'Offer only the legal seating capacity recorded for each vehicle — an EV two-wheeler carries one student.',
      'Accept or decline student requests honestly, and keep availability accurate when you cannot serve a route.',
      'Treat student pickup details as confidential and use them only to complete the accepted ride.',
      'Complete administrator verification before offering rides to students.',
    ],
  },
  {
    id: 'student-obligations',
    heading: 'Student responsibilities',
    list: [
      'Use your own account and keep your contact and emergency details current.',
      'Be at the agreed pickup stop on time, and cancel requests you no longer need.',
      'Treat drivers and fellow students with respect.',
      'Only join a pooling group you genuinely intend to travel with.',
    ],
  },
  {
    id: 'bookings',
    heading: 'Requests, confirmation and cancellations',
    paragraphs: [
      'A community EV ride is not confirmed when you send a request; it becomes confirmed only after the provider accepts it. Bus seat availability reflects the current sample schedule records.',
      'Providers may decline a request, and administrators may cancel a schedule when a service is disrupted. Cancelled services are removed from student search results immediately. Fares are shown before you request a ride, and payments are not collected in this build.',
    ],
  },
  {
    id: 'acceptable-use',
    heading: 'Acceptable use',
    list: [
      'Do not attempt to access another person’s account or an administrator area you were not granted.',
      'Do not scrape, overload or attempt to disrupt the platform.',
      'Do not use the platform to arrange unsolicited commercial transport, harassment or any unlawful activity.',
      'Do not upload false vehicle, licence or identity information.',
    ],
  },
  {
    id: 'liability',
    heading: 'Limitation of liability',
    paragraphs: [
      'ROUTENEX is a coordination platform. Transport is performed by independent providers, and the platform does not itself operate buses or electric vehicles.',
      'To the extent permitted by law, ROUTENEX is not liable for delays, missed services, loss of belongings or injuries arising from a journey. Nothing in these terms limits rights that cannot be limited by law.',
    ],
  },
  {
    id: 'termination',
    heading: 'Suspension and termination',
    paragraphs: [
      'We may suspend an account that breaches these terms, misrepresents a vehicle or provider, or endangers other users. Providers who lose a licence or insurance must stop offering rides and inform the team immediately.',
    ],
  },
  {
    id: 'changes',
    heading: 'Changes to the platform and these terms',
    paragraphs: [
      'Features may change as the network expands to new villages and colleges. Material changes to these terms will be reflected by the “last updated” date on this page.',
    ],
  },
  {
    id: 'contact',
    heading: 'Contact',
    paragraphs: [
      `Questions about these terms can be sent to ${APP.supportEmail}, or posted to ${APP.address}. Phone support is available on ${APP.supportPhone}.`,
    ],
  },
]

export default function TermsPage() {
  useDocumentTitle('Terms of Service')

  return (
    <LegalDoc
      title="Terms of Service"
      updated="13 November 2026"
      intro="These terms govern the use of ROUTENEX by students, transport providers and administrators. They describe what each role may expect from the platform and what the platform expects in return."
      sections={SECTIONS}
    />
  )
}
