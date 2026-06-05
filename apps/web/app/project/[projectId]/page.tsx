/* The Overview content (project identity + the ring) is rendered by the
 * workspace shell in this segment's layout, so the index route itself has
 * nothing to add — the shell shows the identity panel whenever no section is
 * open. Keeping this a no-op page avoids rendering the identity twice. */
export default function ProjectOverviewPage() {
  return null;
}
