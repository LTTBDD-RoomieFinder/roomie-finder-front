// This route exists so that `/` (web) is not "Unmatched Route".
// Actual redirect logic lives in `app/_layout.tsx`.
export default function Index() {
  return null;
}

