// Profile-completion calculator (endowed-progress nudge). Pure + framework-free
// so it's easy to unit-test; the dashboard feeds it the signals it has already
// loaded. A couple of always-done steps seed the bar so members see progress
// they've "already made" and are more likely to finish the rest.

export type ProfileSignals = {
  id: string;
  name: string | null;
  bio: string | null;
  carMake: string | null;
  carModel: string | null;
  homeLat: number | null;
  homeLng: number | null;
  hasBuildPhoto: boolean;
};

export type ProfileStep = {
  key: string;
  label: string;
  done: boolean;
  href: string | null;
};

export type ProfileCompletion = {
  percent: number; // 0–100
  done: number;
  total: number;
  steps: ProfileStep[];
  nextStep: ProfileStep | null; // first incomplete actionable step
};

export function computeProfileCompletion(u: ProfileSignals): ProfileCompletion {
  const memberHref = `/members/${u.id}`;
  const steps: ProfileStep[] = [
    { key: "account", label: "Create your account", done: true, href: null },
    { key: "name", label: "Add your display name", done: !!u.name && u.name.trim().length > 0, href: "/account" },
    { key: "bio", label: "Write a short bio", done: !!u.bio && u.bio.trim().length > 0, href: "/account" },
    { key: "car", label: "Add your car to your garage", done: !!(u.carMake && u.carModel), href: "/account" },
    { key: "location", label: "Set your location for nearby events", done: u.homeLat !== null && u.homeLng !== null, href: "/account" },
    { key: "photo", label: "Upload a photo of your build", done: u.hasBuildPhoto, href: memberHref },
  ];

  const done = steps.filter((s) => s.done).length;
  const total = steps.length;
  const percent = Math.round((done / total) * 100);
  const nextStep = steps.find((s) => !s.done && s.href) ?? null;

  return { percent, done, total, steps, nextStep };
}
