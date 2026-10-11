import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// Shared demo-data loader used by both the CLI seed (prisma/seed.ts) and the
// one-time seed API route. Upcoming event dates are relative to "now" so the
// sample data always looks current.

function slug(base: string, i: number) {
  return (
    base
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-") + `-${i}`
  );
}

export async function wipeAll(prisma: PrismaClient) {
  await prisma.registration.deleteMany();
  await prisma.clubFollow.deleteMany();
  await prisma.venueFollow.deleteMany();
  await prisma.review.deleteMany();
  await prisma.event.deleteMany();
  await prisma.club.deleteMany();
  await prisma.venue.deleteMany();
  await prisma.user.deleteMany();
}

export type SeedSummary = {
  users: number;
  clubs: number;
  venues: number;
  events: number;
};

// One-off backfill for databases seeded before the amenity catalog existed.
// Only touches demo rows (owned by @revmeet.test accounts) plus the generic
// case of venue-linked events that have no amenities yet — never overwrites
// amenity selections real users have made.
export async function backfillDemoAmenities(prisma: PrismaClient) {
  const venueSets: Record<string, string> = {
    "Harewood Speed Hillclimb": "PARKING,TOILETS,FOOD,COFFEE,PADDOCK,TRACK_ACCESS,FIRST_AID",
    "RiverSide Events Arena": "PARKING,TOILETS,FOOD,DRINKS,COFFEE,FLOODLIGHTS,INDOOR,ACCESSIBLE,WIFI",
  };
  const eventSets: Record<string, string> = {
    "London Supercar Show 2025": "PARKING,FOOD,DRINKS,COFFEE,TOILETS,KIDS_AREA,TRADE_STANDS,LIVE_MUSIC,ACCESSIBLE,FIRST_AID",
    "Manchester Night Cruise": "PARKING,COFFEE,SMOKING",
    "Yorkshire Track Day Open": "PARKING,TOILETS,FOOD,COFFEE,PADDOCK,TRACK_ACCESS,FIRST_AID",
    "South West Stance & Style": "PARKING,FOOD,DRINKS,TOILETS,TRADE_STANDS,LIVE_MUSIC,KIDS_AREA",
    "Newcastle Drift Championship": "PARKING,FOOD,TOILETS,TRACK_ACCESS,PADDOCK,FIRST_AID,SECURITY",
    "Glasgow Car Culture Meet": "PARKING,FOOD,COFFEE,TOILETS,PET_FRIENDLY",
    "Cardiff JDM Showcase": "PARKING,FOOD,DRINKS,TOILETS,TRADE_STANDS,LIVE_MUSIC",
    "Midlands Tuner Festival": "PARKING,FOOD,DRINKS,TOILETS,INDOOR,TRADE_STANDS,LIVE_MUSIC,DYNO,SMOKING",
    "Bournemouth Coastal Cruise": "PARKING,COFFEE,TOILETS,PET_FRIENDLY",
    "Classic & Vintage Sunday": "PARKING,FOOD,COFFEE,TOILETS,KIDS_AREA,ACCESSIBLE,PET_FRIENDLY,TRADE_STANDS",
  };

  let venuesUpdated = 0;
  for (const [name, amenities] of Object.entries(venueSets)) {
    const res = await prisma.venue.updateMany({
      where: { name, owner: { email: { endsWith: "@revmeet.test" } } },
      data: { amenities },
    });
    venuesUpdated += res.count;
  }

  let eventsUpdated = 0;
  for (const [title, amenities] of Object.entries(eventSets)) {
    const res = await prisma.event.updateMany({
      where: { title, organiser: { email: { endsWith: "@revmeet.test" } } },
      data: { amenities },
    });
    eventsUpdated += res.count;
  }

  // Any remaining venue-linked event with no amenities inherits its venue's.
  const inheritable = await prisma.event.findMany({
    where: { amenities: "", venueId: { not: null } },
    select: { id: true, venue: { select: { amenities: true } } },
  });
  let inherited = 0;
  for (const e of inheritable) {
    if (e.venue?.amenities) {
      await prisma.event.update({
        where: { id: e.id },
        data: { amenities: e.venue.amenities },
      });
      inherited++;
    }
  }

  return { venuesUpdated, eventsUpdated, inherited };
}

export async function seedDemoData(
  prisma: PrismaClient,
  opts: { reset?: boolean } = {},
): Promise<SeedSummary> {
  if (opts.reset) await wipeAll(prisma);

  const password = await bcrypt.hash("password123", 10);
  let users = 0;

  // --- Admin demo user ---
  await prisma.user.create({
    data: {
      email: "admin@revmeet.test",
      name: "RevMeet Admin",
      passwordHash: password,
      role: "ADMIN",
      avatarColor: "#F44336",
    },
  });
  users++;

  // --- Enthusiast demo user ---
  const enthusiast = await prisma.user.create({
    data: {
      email: "enthusiast@revmeet.test",
      name: "Jake Reynolds",
      passwordHash: password,
      role: "ENTHUSIAST",
      avatarColor: "#FF5F1F",
    },
  });
  users++;

  // --- Clubs (organisers) ---
  const clubSeed = [
    {
      email: "eastlondon@revmeet.test",
      owner: "East London AutoClub",
      name: "East London AutoClub",
      description:
        "One of London's most active car clubs. Weekly meets, monthly shows and organised track days across the South East.",
      location: "Stratford, London E15",
      region: "London",
      categories: "Track Days, Meets",
      image:
        "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=800&q=80",
    },
    {
      email: "northerndrift@revmeet.test",
      owner: "Northern Drift Alliance",
      name: "Northern Drift Alliance",
      description:
        "The North's premier drift club. From beginner-friendly practice days to full competition events with judged runs.",
      location: "Sheffield, S1",
      region: "Yorkshire",
      categories: "Drift, Track Days",
      image:
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80",
    },
    {
      email: "scottish@revmeet.test",
      owner: "Scottish Car Culture",
      name: "Scottish Car Culture",
      description:
        "Scotland's largest car community — regular weekend meets, charity cruises and an annual summer show that draws hundreds.",
      location: "Glasgow, G1",
      region: "Scotland",
      categories: "Shows, Cruises, JDM",
      image:
        "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800&q=80",
    },
    {
      email: "westmids@revmeet.test",
      owner: "West Midlands Modified",
      name: "West Midlands Modified",
      description:
        "Birmingham's home for the modified scene — monthly meets, show-and-shine days and a thriving online community.",
      location: "Birmingham, B1",
      region: "West Midlands",
      categories: "Shows, Meets, Stance",
      image:
        "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80",
    },
    {
      email: "southcoast@revmeet.test",
      owner: "South Coast Cruisers",
      name: "South Coast Cruisers",
      description:
        "Relaxed seaside cruises and meets along the South Coast, from Brighton to Bournemouth. All makes and models welcome.",
      location: "Brighton, BN1",
      region: "South East",
      categories: "Cruises, Meets",
      image:
        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80",
    },
    {
      email: "welshvalleys@revmeet.test",
      owner: "Welsh Valleys Motor Club",
      name: "Welsh Valleys Motor Club",
      description:
        "Celebrating classic and performance motoring across South Wales with scenic drives through the valleys and summer shows.",
      location: "Cardiff, CF10",
      region: "Wales",
      categories: "Classic, Shows, Cruises",
      image:
        "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=800&q=80",
    },
    {
      email: "thamesvalley@revmeet.test",
      owner: "Thames Valley Supercars",
      name: "Thames Valley Supercars",
      description:
        "An exclusive supercar club running breakfast meets and charity convoys across the Home Counties.",
      location: "Reading, RG1",
      region: "South East",
      categories: "Supercar, Meets",
      image:
        "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80",
    },
    {
      email: "highland@revmeet.test",
      owner: "Highland Performance Club",
      name: "Highland Performance Club",
      description:
        "Track days and spirited drives through the Scottish Highlands — some of the best driving roads in the UK.",
      location: "Inverness, IV1",
      region: "Scotland",
      categories: "Track Days, Cruises",
      image:
        "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=800&q=80",
    },
    {
      email: "merseyjdm@revmeet.test",
      owner: "Mersey JDM Collective",
      name: "Mersey JDM Collective",
      description:
        "Merseyside's Japanese car community — JDM meets, show-and-shine nights and group trips to the big northern shows.",
      location: "Liverpool, L1",
      region: "North West",
      categories: "JDM, Stance, Meets",
      image:
        "https://images.unsplash.com/photo-1541443131876-44b03de101c5?auto=format&fit=crop&w=800&q=80",
    },
  ];

  const clubs: { clubId: string; ownerId: string }[] = [];
  for (let i = 0; i < clubSeed.length; i++) {
    const c = clubSeed[i];
    const owner = await prisma.user.create({
      data: {
        email: c.email,
        name: c.owner,
        passwordHash: password,
        role: "ORGANISER",
        avatarColor: ["#FF5F1F", "#E040FB", "#00BCD4"][i % 3],
      },
    });
    users++;
    const club = await prisma.club.create({
      data: {
        ownerId: owner.id,
        name: c.name,
        slug: slug(c.name, i),
        description: c.description,
        location: c.location,
        region: c.region,
        categories: c.categories,
        imageUrl: c.image,
      },
    });
    clubs.push({ clubId: club.id, ownerId: owner.id });
  }

  // --- Venues ---
  const venueSeed = [
    {
      email: "harewood@revmeet.test",
      name: "Harewood Speed Hillclimb",
      description:
        "A historic hillclimb venue in the Yorkshire countryside, perfect for track days, sprints and spectator car shows.",
      address: "Harewood Estate",
      city: "Leeds",
      postcode: "LS17 9LG",
      lat: 53.9008,
      lng: -1.5342,
      categories: "Track, Hillclimb, Showground",
      amenities: "PARKING,TOILETS,FOOD,COFFEE,PADDOCK,TRACK_ACCESS,FIRST_AID",
      capacity: 500,
      image:
        "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=800&q=80",
    },
    {
      email: "excel@revmeet.test",
      name: "RiverSide Events Arena",
      description:
        "A large covered arena and outdoor car park on the Thames — a flexible space that regularly hosts indoor car shows and meets.",
      address: "1 Dockside Road",
      city: "London",
      postcode: "E16 1XL",
      lat: 51.5081,
      lng: 0.0294,
      categories: "Indoor, Showground, Car Park",
      amenities: "PARKING,TOILETS,FOOD,DRINKS,COFFEE,FLOODLIGHTS,INDOOR,ACCESSIBLE,WIFI",
      capacity: 1200,
      image:
        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80",
    },
    {
      email: "castlecombe@revmeet.test",
      name: "Castle Combe Circuit",
      description:
        "Wiltshire's historic motor-racing circuit, hosting track days, sprints and club car shows throughout the season.",
      address: "Castle Combe",
      city: "Chippenham",
      postcode: "SN14 7EY",
      lat: 51.4938,
      lng: -2.2142,
      categories: "Track, Circuit, Showground",
      amenities: "PARKING,TOILETS,FOOD,COFFEE,PADDOCK,TRACK_ACCESS,FIRST_AID,SECURITY",
      capacity: 2000,
      image:
        "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=800&q=80",
    },
    {
      email: "goodwood@revmeet.test",
      name: "Goodwood Motor Circuit",
      description:
        "The legendary West Sussex circuit — a bucket-list venue for track days, classic gatherings and show-and-shine events.",
      address: "Goodwood",
      city: "Chichester",
      postcode: "PO18 0PH",
      lat: 50.8569,
      lng: -0.7594,
      categories: "Track, Circuit, Showground",
      amenities: "PARKING,TOILETS,FOOD,DRINKS,COFFEE,PADDOCK,TRACK_ACCESS,FIRST_AID,ACCESSIBLE",
      capacity: 3000,
      image:
        "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=800&q=80",
    },
    {
      email: "necbirmingham@revmeet.test",
      name: "NEC Birmingham Hall",
      description:
        "A vast indoor exhibition hall in the Midlands, ideal for large indoor car shows, trade exhibitions and winter meets.",
      address: "North Avenue, Marston Green",
      city: "Birmingham",
      postcode: "B40 1NT",
      lat: 52.4514,
      lng: -1.7181,
      categories: "Indoor, Showground, Exhibition",
      amenities: "PARKING,TOILETS,FOOD,DRINKS,COFFEE,INDOOR,ACCESSIBLE,WIFI,TRADE_STANDS,SECURITY",
      capacity: 5000,
      image:
        "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80",
    },
    {
      email: "brightonseafront@revmeet.test",
      name: "Brighton Seafront Car Park",
      description:
        "An iconic seafront location for coastal cruises and evening meets, with the sea as a backdrop and plenty of space.",
      address: "Madeira Drive",
      city: "Brighton",
      postcode: "BN2 1EN",
      lat: 50.8198,
      lng: -0.1316,
      categories: "Car Park, Seafront, Meet Point",
      amenities: "PARKING,TOILETS,COFFEE,FOOD,PET_FRIENDLY,ACCESSIBLE",
      capacity: 300,
      image:
        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80",
    },
  ];

  let venues = 0;
  for (let i = 0; i < venueSeed.length; i++) {
    const v = venueSeed[i];
    const owner = await prisma.user.create({
      data: {
        email: v.email,
        name: v.name,
        passwordHash: password,
        role: "VENUE",
        avatarColor: "#00BCD4",
      },
    });
    users++;
    await prisma.venue.create({
      data: {
        ownerId: owner.id,
        name: v.name,
        slug: slug(v.name, i),
        description: v.description,
        address: v.address,
        city: v.city,
        postcode: v.postcode,
        lat: v.lat,
        lng: v.lng,
        categories: v.categories,
        amenities: v.amenities,
        capacity: v.capacity,
        imageUrl: v.image,
      },
    });
    venues++;
  }

  // --- Events (dates relative to now, always upcoming) ---
  const now = new Date();
  const day = (n: number, hour = 10) => {
    const d = new Date(now);
    d.setDate(d.getDate() + n);
    d.setHours(hour, 0, 0, 0);
    return d;
  };

  const eventSeed = [
    { title: "London Supercar Show 2025", type: "SUPERCAR_MEET", city: "London", region: "Greater London", lat: 51.5074, lng: -0.1278, days: 12, cap: 600, price: "£25", club: 0, amen: "PARKING,FOOD,DRINKS,COFFEE,TOILETS,KIDS_AREA,TRADE_STANDS,LIVE_MUSIC,ACCESSIBLE,FIRST_AID", img: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80", desc: "Europe's most exclusive supercar gathering. 200+ vehicles expected with full-day entertainment, food trucks and live commentary." },
    { title: "Manchester Night Cruise", type: "NIGHT_CRUISE", city: "Manchester", region: "Greater Manchester", lat: 53.4808, lng: -2.2426, days: 6, cap: 150, price: "Free", club: 0, amen: "PARKING,COFFEE,SMOKING", img: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80", desc: "Start your engines at midnight. A city-wide cruise through Manchester with 100+ cars. All welcome, sensible driving only." },
    { title: "Yorkshire Track Day Open", type: "TRACK_DAY", city: "Leeds", region: "Yorkshire", lat: 53.9008, lng: -1.5342, days: 20, cap: 80, price: "£120", club: 1, amen: "PARKING,TOILETS,FOOD,COFFEE,PADDOCK,TRACK_ACCESS,FIRST_AID", img: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=800&q=80", desc: "Open track day at Harewood. All cars welcome. Instruction available for novices, timed runs in the afternoon." },
    { title: "South West Stance & Style", type: "STANCE_MEET", city: "Bristol", region: "South West", lat: 51.4545, lng: -2.5879, days: 27, cap: 400, price: "£8 on the gate", club: 2, amen: "PARKING,FOOD,DRINKS,TOILETS,TRADE_STANDS,LIVE_MUSIC,KIDS_AREA", img: "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80", desc: "The South West's biggest stance and modified car show. Judged categories, prizes, trade stands and a live DJ." },
    { title: "Newcastle Drift Championship", type: "DRIFT_EVENT", city: "Newcastle", region: "North East", lat: 54.9783, lng: -1.6178, days: 34, cap: 200, price: "£15", club: 1, amen: "PARKING,FOOD,TOILETS,TRACK_ACCESS,PADDOCK,FIRST_AID,SECURITY", img: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80", desc: "Round 3 of the Northern Drift Championship. Pro and semi-pro classes, tandem battles and a lively spectator area." },
    { title: "Glasgow Car Culture Meet", type: "MEET", city: "Glasgow", region: "Scotland", lat: 55.8642, lng: -4.2518, days: 9, cap: 250, price: "Free", club: 2, amen: "PARKING,FOOD,COFFEE,TOILETS,PET_FRIENDLY", img: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800&q=80", desc: "Monthly community meet in the heart of Glasgow. Bring anything with an engine — everyone's welcome." },
    { title: "Cardiff JDM Showcase", type: "JDM_MEET", city: "Cardiff", region: "Wales", lat: 51.4816, lng: -3.1791, days: 40, cap: 300, price: "£10", club: 2, amen: "PARKING,FOOD,DRINKS,TOILETS,TRADE_STANDS,LIVE_MUSIC", img: "https://images.unsplash.com/photo-1541443131876-44b03de101c5?auto=format&fit=crop&w=800&q=80", desc: "The best of Japanese performance and culture. Skylines, Supras, rotaries and more, with a dedicated show-and-shine area." },
    { title: "Midlands Tuner Festival", type: "CAR_SHOW", city: "Birmingham", region: "West Midlands", lat: 52.4862, lng: -1.8904, days: 18, cap: 800, price: "£12", club: 0, amen: "PARKING,FOOD,DRINKS,TOILETS,INDOOR,TRADE_STANDS,LIVE_MUSIC,DYNO,SMOKING", img: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80", desc: "A huge indoor and outdoor festival of modified cars, dyno competitions, trade village and evening after-party." },
    { title: "Bournemouth Coastal Cruise", type: "NIGHT_CRUISE", city: "Bournemouth", region: "South West", lat: 50.726, lng: -1.8795, days: 47, cap: 180, price: "Free", club: 2, amen: "PARKING,COFFEE,TOILETS,PET_FRIENDLY", img: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80", desc: "A scenic evening cruise along the Dorset coast finishing at the seafront for a relaxed meet." },
    { title: "Classic & Vintage Sunday", type: "CLASSIC_CARS", city: "Oxford", region: "South East", lat: 51.752, lng: -1.2577, days: 25, cap: 350, price: "£6", club: 0, amen: "PARKING,FOOD,COFFEE,TOILETS,KIDS_AREA,ACCESSIBLE,PET_FRIENDLY,TRADE_STANDS", img: "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=800&q=80", desc: "A relaxed gathering of classic and vintage motors on the green. Concours judging, picnic area and vintage traders." },
    { title: "Edinburgh Festival of Speed", type: "SUPERCAR_MEET", city: "Edinburgh", region: "Scotland", lat: 55.9533, lng: -3.1883, days: 15, cap: 500, price: "£20", club: 4, amen: "PARKING,FOOD,DRINKS,COFFEE,TOILETS,TRADE_STANDS,LIVE_MUSIC,ACCESSIBLE,FIRST_AID", img: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80", desc: "A celebration of speed in the Scottish capital — supercars, hypercars and a paddock of rare machinery on display all day." },
    { title: "Liverpool JDM Night", type: "JDM_MEET", city: "Liverpool", region: "North West", lat: 53.4084, lng: -2.9916, days: 8, cap: 220, price: "£5", club: 8, amen: "PARKING,COFFEE,FOOD,TOILETS,SMOKING", img: "https://images.unsplash.com/photo-1541443131876-44b03de101c5?auto=format&fit=crop&w=800&q=80", desc: "An after-dark meet for the Japanese scene on the Liverpool docks. Neon, downpipes and a seriously good turnout." },
    { title: "Brighton Seafront Meet", type: "MEET", city: "Brighton", region: "South East", lat: 50.8225, lng: -0.1372, days: 5, cap: 200, price: "Free", club: 5, amen: "PARKING,COFFEE,TOILETS,FOOD,PET_FRIENDLY", img: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800&q=80", desc: "A laid-back coastal meet on Madeira Drive. Grab a coffee, park up and watch the sun go down over the sea." },
    { title: "Castle Combe Track Day", type: "TRACK_DAY", city: "Chippenham", region: "South West", lat: 51.4938, lng: -2.2142, days: 22, cap: 100, price: "£135", club: 6, amen: "PARKING,TOILETS,FOOD,COFFEE,PADDOCK,TRACK_ACCESS,FIRST_AID,SECURITY", img: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=800&q=80", desc: "A full day of open-pit lapping at the historic Castle Combe circuit. Sighting laps, instruction and timed sessions." },
    { title: "Goodwood Classic Breakfast", type: "CLASSIC_CARS", city: "Chichester", region: "South East", lat: 50.8569, lng: -0.7594, days: 11, cap: 400, price: "£15", club: 5, amen: "PARKING,FOOD,COFFEE,TOILETS,ACCESSIBLE,KIDS_AREA", img: "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=800&q=80", desc: "A Sunday-morning gathering of classics at the iconic Goodwood circuit. Bacon rolls, coffee and timeless machinery." },
    { title: "Birmingham Winter Indoor Show", type: "CAR_SHOW", city: "Birmingham", region: "West Midlands", lat: 52.4514, lng: -1.7181, days: 30, cap: 1500, price: "£18", club: 0, amen: "PARKING,FOOD,DRINKS,COFFEE,TOILETS,INDOOR,ACCESSIBLE,WIFI,TRADE_STANDS,SECURITY", img: "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80", desc: "The Midlands' biggest indoor show. Hundreds of show cars across multiple halls, a huge trade village and demos." },
    { title: "Leeds Stance Wars", type: "STANCE_MEET", city: "Leeds", region: "Yorkshire", lat: 53.8008, lng: -1.5491, days: 19, cap: 350, price: "£8", club: 1, amen: "PARKING,FOOD,DRINKS,TOILETS,TRADE_STANDS,LIVE_MUSIC", img: "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80", desc: "Yorkshire's premier stance and fitment show. Judged categories, a DJ all day and some of the cleanest builds around." },
    { title: "Snowdonia Mountain Cruise", type: "NIGHT_CRUISE", city: "Betws-y-Coed", region: "Wales", lat: 53.096, lng: -3.8003, days: 26, cap: 120, price: "Free", club: 2, amen: "PARKING,COFFEE,TOILETS,PET_FRIENDLY", img: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80", desc: "A scenic convoy through the mountain passes of Snowdonia, finishing with a sunset meet by the lake." },
    { title: "Reading Supercar Breakfast", type: "SUPERCAR_MEET", city: "Reading", region: "South East", lat: 51.4543, lng: -0.9781, days: 7, cap: 150, price: "£12", club: 3, amen: "PARKING,COFFEE,FOOD,TOILETS,ACCESSIBLE", img: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80", desc: "An early-morning gathering of exotics in the Thames Valley. Coffee, pastries and a car park full of horsepower." },
    { title: "Highland Hillclimb Sprint", type: "TRACK_DAY", city: "Inverness", region: "Scotland", lat: 57.4778, lng: -4.2247, days: 44, cap: 90, price: "£110", club: 4, amen: "PARKING,TOILETS,FOOD,COFFEE,PADDOCK,TRACK_ACCESS,FIRST_AID", img: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=800&q=80", desc: "Timed hillclimb sprints against the backdrop of the Highlands. Open to road cars and dedicated competition machines." },
    { title: "Nottingham Drift Jam", type: "DRIFT_EVENT", city: "Nottingham", region: "East Midlands", lat: 52.9548, lng: -1.1581, days: 33, cap: 250, price: "£15", club: 1, amen: "PARKING,FOOD,TOILETS,TRACK_ACCESS,PADDOCK,FIRST_AID,SECURITY", img: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80", desc: "A full day of sideways action with practice sessions, tandem battles and a relaxed, friendly paddock." },
    { title: "Portsmouth Harbour Meet", type: "MEET", city: "Portsmouth", region: "South East", lat: 50.8198, lng: -1.088, days: 13, cap: 180, price: "Free", club: 5, amen: "PARKING,COFFEE,FOOD,TOILETS,PET_FRIENDLY", img: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800&q=80", desc: "A harbourside community meet open to everything from classics to modern metal. Food vans and a great atmosphere." },
    { title: "Norwich Classic Car Sunday", type: "CLASSIC_CARS", city: "Norwich", region: "East of England", lat: 52.6309, lng: 1.2974, days: 38, cap: 300, price: "£6", club: 0, amen: "PARKING,FOOD,COFFEE,TOILETS,KIDS_AREA,ACCESSIBLE,PET_FRIENDLY", img: "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=800&q=80", desc: "A family-friendly classic gathering with concours judging, a picnic area and vintage trade stands." },
    { title: "Manchester JDM Expo", type: "JDM_MEET", city: "Manchester", region: "Greater Manchester", lat: 53.4808, lng: -2.2426, days: 24, cap: 450, price: "£14", club: 8, amen: "PARKING,FOOD,DRINKS,TOILETS,INDOOR,TRADE_STANDS,LIVE_MUSIC", img: "https://images.unsplash.com/photo-1541443131876-44b03de101c5?auto=format&fit=crop&w=800&q=80", desc: "An indoor expo dedicated to Japanese performance — show cars, specialist traders and live builds in progress." },
    { title: "Plymouth Coastal Cruise", type: "NIGHT_CRUISE", city: "Plymouth", region: "South West", lat: 50.3755, lng: -4.1427, days: 50, cap: 160, price: "Free", club: 5, amen: "PARKING,COFFEE,TOILETS,PET_FRIENDLY", img: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80", desc: "An evening cruise along the Devon coastline ending at the Hoe for a relaxed seafront meet." },
    { title: "Sheffield Tuner Meet", type: "MEET", city: "Sheffield", region: "Yorkshire", lat: 53.3811, lng: -1.4701, days: 10, cap: 220, price: "£5", club: 1, amen: "PARKING,FOOD,COFFEE,TOILETS,DYNO,SMOKING", img: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80", desc: "A monthly meet for the tuner crowd with an on-site dyno, food vans and plenty of engine bays on show." },
    { title: "Cambridge Supercar Sunday", type: "SUPERCAR_MEET", city: "Cambridge", region: "East of England", lat: 52.2053, lng: 0.1218, days: 17, cap: 260, price: "£10", club: 3, amen: "PARKING,FOOD,DRINKS,COFFEE,TOILETS,ACCESSIBLE", img: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80", desc: "A Sunday showcase of supercars and modern classics, with proceeds from entry going to a local charity." },
    { title: "Belfast Car Culture Festival", type: "CAR_SHOW", city: "Belfast", region: "Northern Ireland", lat: 54.5973, lng: -5.9301, days: 55, cap: 700, price: "£16", club: 8, amen: "PARKING,FOOD,DRINKS,TOILETS,TRADE_STANDS,LIVE_MUSIC,KIDS_AREA,ACCESSIBLE", img: "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80", desc: "Northern Ireland's biggest celebration of car culture — hundreds of cars, live entertainment and a family zone." },
    { title: "Cotswolds Classic Tour", type: "CLASSIC_CARS", city: "Cheltenham", region: "South West", lat: 51.8994, lng: -2.0783, days: 29, cap: 140, price: "£25", club: 2, amen: "PARKING,FOOD,COFFEE,TOILETS,PET_FRIENDLY", img: "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=800&q=80", desc: "A guided classic-car tour through the Cotswolds' prettiest villages, finishing with lunch at a country pub." },
    { title: "Milton Keynes Night Meet", type: "NIGHT_CRUISE", city: "Milton Keynes", region: "South East", lat: 52.0406, lng: -0.7594, days: 14, cap: 300, price: "Free", club: 0, amen: "PARKING,COFFEE,TOILETS,SMOKING,SECURITY", img: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80", desc: "A big open-air evening meet on the MK grid. Food vans, a chilled vibe and everything from stance to supercars." },
  ];

  // A handful of demo events ship pre-promoted (as if paid) for 60 days,
  // spread across the list so the homepage Spotlight / featured sorting looks
  // populated.
  const featuredIdx = new Set([0, 7, 14, 18, 23, 28]);

  let events = 0;
  for (let i = 0; i < eventSeed.length; i++) {
    const e = eventSeed[i];
    const { clubId, ownerId } = clubs[e.club];
    const event = await prisma.event.create({
      data: {
        title: e.title,
        slug: slug(e.title, i),
        description: e.desc,
        type: e.type,
        status: "PUBLISHED",
        startsAt: day(e.days, 10),
        endsAt: day(e.days, 17),
        city: e.city,
        region: e.region,
        lat: e.lat,
        lng: e.lng,
        imageUrl: e.img,
        capacity: e.cap,
        priceInfo: e.price,
        amenities: (e as { amen?: string }).amen ?? "",
        featured: featuredIdx.has(i),
        featuredUntil: featuredIdx.has(i) ? day(60) : null,
        organiserId: ownerId,
        clubId,
      },
    });
    events++;

    if (i < 3) {
      await prisma.registration.create({
        data: { userId: enthusiast.id, eventId: event.id },
      });
    }
  }

  await prisma.clubFollow.create({ data: { userId: enthusiast.id, clubId: clubs[0].clubId } });
  await prisma.clubFollow.create({ data: { userId: enthusiast.id, clubId: clubs[2].clubId } });

  return { users, clubs: clubs.length, venues, events };
}
