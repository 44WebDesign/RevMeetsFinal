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

export async function seedDemoData(
  prisma: PrismaClient,
  opts: { reset?: boolean } = {},
): Promise<SeedSummary> {
  if (opts.reset) await wipeAll(prisma);

  const password = await bcrypt.hash("password123", 10);
  let users = 0;

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
      amenities: "Parking, Toilets, Catering, Paddock",
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
      amenities: "Parking, Toilets, Catering, Floodlights, Indoor",
      capacity: 1200,
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
    { title: "London Supercar Show 2025", type: "SUPERCAR_MEET", city: "London", region: "Greater London", lat: 51.5074, lng: -0.1278, days: 12, cap: 600, price: "£25", club: 0, img: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80", desc: "Europe's most exclusive supercar gathering. 200+ vehicles expected with full-day entertainment, food trucks and live commentary." },
    { title: "Manchester Night Cruise", type: "NIGHT_CRUISE", city: "Manchester", region: "Greater Manchester", lat: 53.4808, lng: -2.2426, days: 6, cap: 150, price: "Free", club: 0, img: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80", desc: "Start your engines at midnight. A city-wide cruise through Manchester with 100+ cars. All welcome, sensible driving only." },
    { title: "Yorkshire Track Day Open", type: "TRACK_DAY", city: "Leeds", region: "Yorkshire", lat: 53.9008, lng: -1.5342, days: 20, cap: 80, price: "£120", club: 1, img: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=800&q=80", desc: "Open track day at Harewood. All cars welcome. Instruction available for novices, timed runs in the afternoon." },
    { title: "South West Stance & Style", type: "STANCE_MEET", city: "Bristol", region: "South West", lat: 51.4545, lng: -2.5879, days: 27, cap: 400, price: "£8 on the gate", club: 2, img: "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80", desc: "The South West's biggest stance and modified car show. Judged categories, prizes, trade stands and a live DJ." },
    { title: "Newcastle Drift Championship", type: "DRIFT_EVENT", city: "Newcastle", region: "North East", lat: 54.9783, lng: -1.6178, days: 34, cap: 200, price: "£15", club: 1, img: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80", desc: "Round 3 of the Northern Drift Championship. Pro and semi-pro classes, tandem battles and a lively spectator area." },
    { title: "Glasgow Car Culture Meet", type: "MEET", city: "Glasgow", region: "Scotland", lat: 55.8642, lng: -4.2518, days: 9, cap: 250, price: "Free", club: 2, img: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800&q=80", desc: "Monthly community meet in the heart of Glasgow. Bring anything with an engine — everyone's welcome." },
    { title: "Cardiff JDM Showcase", type: "JDM_MEET", city: "Cardiff", region: "Wales", lat: 51.4816, lng: -3.1791, days: 40, cap: 300, price: "£10", club: 2, img: "https://images.unsplash.com/photo-1541443131876-44b03de101c5?auto=format&fit=crop&w=800&q=80", desc: "The best of Japanese performance and culture. Skylines, Supras, rotaries and more, with a dedicated show-and-shine area." },
    { title: "Midlands Tuner Festival", type: "CAR_SHOW", city: "Birmingham", region: "West Midlands", lat: 52.4862, lng: -1.8904, days: 18, cap: 800, price: "£12", club: 0, img: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80", desc: "A huge indoor and outdoor festival of modified cars, dyno competitions, trade village and evening after-party." },
    { title: "Bournemouth Coastal Cruise", type: "NIGHT_CRUISE", city: "Bournemouth", region: "South West", lat: 50.726, lng: -1.8795, days: 47, cap: 180, price: "Free", club: 2, img: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80", desc: "A scenic evening cruise along the Dorset coast finishing at the seafront for a relaxed meet." },
    { title: "Classic & Vintage Sunday", type: "CLASSIC_CARS", city: "Oxford", region: "South East", lat: 51.752, lng: -1.2577, days: 25, cap: 350, price: "£6", club: 0, img: "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=800&q=80", desc: "A relaxed gathering of classic and vintage motors on the green. Concours judging, picnic area and vintage traders." },
  ];

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
