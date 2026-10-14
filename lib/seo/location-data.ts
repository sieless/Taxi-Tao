export interface RegionalContact {
  name: string;
  phone: string;
  whatsapp?: string;
  role?: string;
}

export interface LocationInfo {
  county: string;
  town: string;
  slug: string;
  population?: string;
  description?: string;
  keywords: string[];
  subLocations: string[];
  directContacts: RegionalContact[];
}

/**
 * STRICT OPERATIONAL SERVICE AREAS ONLY:
 * Kericho, Machakos, Kitui, Kajiado, Nairobi, Makueni.
 * All out-of-scope regions have been pruned to prevent unfulfillable customer calls.
 */
const OPERATIONAL_LOCATIONS: LocationInfo[] = [
  // 1. MACHAKOS COUNTY
  {
    county: "Machakos",
    town: "Machakos Town",
    slug: "machakos-town",
    population: "200,000+",
    description: "Machakos Town is the bustling capital of Machakos County, linking Nairobi to the Ukambani region with direct local driver services.",
    keywords: [
      "taxi Machakos",
      "car hire Machakos",
      "Machakos taxi service",
      "Machakos car rental",
      "taxi from Machakos to Nairobi",
      "Machakos town transport"
    ],
    subLocations: ["Machakos CBD", "Masii", "Kangundo", "Kathiani", "Tala", "Wamunyu", "Mitaboni"],
    directContacts: [
      { name: "Benjamin Mutua (Semse)", phone: "+254 710 450640", whatsapp: "+254 710 450640", role: "Local Driver / Car Hire" },
      { name: "Benjamin Mutwii", phone: "+254 723 950265", role: "Machakos Taxi Driver" },
      { name: "Charles Nziu", phone: "+254 727 494137", role: "Machakos Taxi Driver" },
      { name: "Sebastian Francis", phone: "+254 754 706204", role: "Machakos Taxi Driver" },
    ],
  },
  {
    county: "Machakos",
    town: "Athi River",
    slug: "athi-river",
    population: "150,000+",
    description: "Athi River, Mlolongo, and Syokimau corridor along Mombasa Road with fast direct driver dispatch to JKIA, SGR, and Nairobi CBD.",
    keywords: [
      "taxi Athi River",
      "car hire Athi River",
      "Athi River taxi service",
      "Mlolongo taxi",
      "Syokimau taxi",
      "JKIA to Athi River taxi"
    ],
    subLocations: ["Mlolongo", "Syokimau", "Athi River CBD", "Greatwall", "SGR Terminus"],
    directContacts: [
      { name: "Stephen Nthakyo", phone: "+254 743 471227", role: "Athi River Driver" },
      { name: "Nicholas Mutisya", phone: "+254 710 122800", role: "Kyumvi Junction / Athi River Corridor" },
    ],
  },

  // 2. NAIROBI COUNTY
  {
    county: "Nairobi",
    town: "Nairobi CBD",
    slug: "nairobi-cbd",
    population: "5,000,000+",
    description: "Nairobi CBD and central business hub served by dedicated TaxiTao verified drivers for direct city rides, airport transfers, and inter-county travel.",
    keywords: [
      "taxi Nairobi",
      "car hire Nairobi",
      "Nairobi taxi booking",
      "Nairobi car rental",
      "Nairobi to airport taxi",
      "Nairobi executive car hire"
    ],
    subLocations: ["Nairobi CBD", "Upper Hill", "South B", "South C", "Eastlands", "Utawala", "Embakasi"],
    directContacts: [
      { name: "Vincent Nzioki", phone: "+254 721 317413", role: "Nairobi Executive Driver" },
      { name: "Bonface Moriang’o", phone: "+254 710 600013", role: "Utawala / Nairobi Driver" },
    ],
  },
  {
    county: "Nairobi",
    town: "Westlands",
    slug: "westlands",
    population: "300,000+",
    description: "Westlands premier commercial and entertainment hub with verified drivers available for executive car hire, airport runs, and city transport.",
    keywords: [
      "taxi Westlands Nairobi",
      "car hire Westlands",
      "Westlands taxi service",
      "Westlands car rental",
      "Westlands to airport"
    ],
    subLocations: ["Westlands CBD", "Parklands", "Highridge", "Sarit", "Waiyaki Way"],
    directContacts: [
      { name: "Vincent Nzioki", phone: "+254 721 317413", role: "Nairobi Driver" },
    ],
  },
  {
    county: "Nairobi",
    town: "Kilimani",
    slug: "kilimani",
    population: "200,000+",
    description: "Kilimani and Kileleshwa upscale residential and business district with on-demand taxis and executive car rentals.",
    keywords: [
      "taxi Kilimani",
      "car hire Kilimani",
      "Kilimani taxi service",
      "Kilimani car rental",
      "Kileleshwa taxi",
      "Hurlingham taxi"
    ],
    subLocations: ["Kilimani CBD", "Yaya Centre", "Kileleshwa", "Hurlingham", "Lavington"],
    directContacts: [
      { name: "Vincent Nzioki", phone: "+254 721 317413", role: "Nairobi Driver" },
    ],
  },
  {
    county: "Nairobi",
    town: "Karen",
    slug: "karen",
    population: "200,000+",
    description: "Karen leafy suburbs and Lang'ata with direct driver bookings for airport transfers, leisure trips, and day-hire chauffeured vehicles.",
    keywords: [
      "taxi Karen Nairobi",
      "car hire Karen",
      "Karen taxi service",
      "Karen car rental",
      "Karen to airport taxi",
      "executive taxi Karen"
    ],
    subLocations: ["Karen Shopping Centre", "Lang'ata", "Hardy", "Bogani", "Ngong Road"],
    directContacts: [
      { name: "Geoffrey", phone: "+254 791 374281", whatsapp: "+254 791 374281", role: "Karen / Ngong Corridor Driver" },
      { name: "Vincent Nzioki", phone: "+254 721 317413", role: "Nairobi Driver" },
    ],
  },

  // 3. KERICHO COUNTY
  {
    county: "Kericho",
    town: "Kericho Town",
    slug: "kericho-town",
    population: "200,000+",
    description: "Kericho Town tea capital transport hub with verified local drivers offering direct taxi bookings and car hire across the South Rift.",
    keywords: [
      "taxi Kericho",
      "car hire Kericho",
      "Kericho taxi service",
      "Kericho car rental",
      "Kericho town taxi",
      "taxi Kericho county"
    ],
    subLocations: ["Kericho CBD", "Brooke", "Chepseon", "Kipkelion", "Londiani", "Litein", "Kabianga"],
    directContacts: [
      { name: "Ben Car Hire", phone: "+254 724 280783", whatsapp: "+254 724 280783", role: "Kericho Car Hire & Taxi" },
      { name: "Ramsey Car Hire", phone: "+254 701 037992", whatsapp: "+254 701 037992", role: "Kericho Car Hire & Taxi" },
      { name: "Michael Chege", phone: "+254 708 627454", role: "Kericho Taxi Driver" },
    ],
  },
  {
    county: "Kericho",
    town: "Kapkatet",
    slug: "kapkatet",
    population: "80,000+",
    description: "Kapkatet and Litein commercial hub in Kericho County with on-demand taxi rides and inter-town travel connections.",
    keywords: [
      "taxi Kapkatet",
      "car hire Kapkatet",
      "Kapkatet taxi service",
      "Litein taxi",
      "Kapkatet transport",
      "Kericho to Kapkatet taxi"
    ],
    subLocations: ["Kapkatet CBD", "Litein", "Bureti", "Roret", "Sotik Junction"],
    directContacts: [
      { name: "Ben Car Hire", phone: "+254 724 280783", whatsapp: "+254 724 280783", role: "Kericho / Kapkatet Fleet" },
      { name: "Ramsey Car Hire", phone: "+254 701 037992", whatsapp: "+254 701 037992", role: "Kericho / Kapkatet Fleet" },
    ],
  },

  // 4. KAJIADO COUNTY
  {
    county: "Kajiado",
    town: "Kitengela",
    slug: "kitengela",
    population: "250,000+",
    description: "Kitengela bustling commercial hub with direct taxi and car rental drivers connecting to Nairobi, Athi River, and Namanga.",
    keywords: [
      "taxi Kitengela",
      "car hire Kitengela",
      "Kitengela taxi service",
      "Kitengela car rental",
      "taxi Kitengela to Nairobi",
      "Kitengela airport taxi"
    ],
    subLocations: ["Kitengela CBD", "Yukos", "Acacia", "EPZ", "Isinya"],
    directContacts: [
      { name: "Geoffrey", phone: "+254 791 374281", whatsapp: "+254 791 374281", role: "Kajiado Regional Driver" },
      { name: "Stephen Nthakyo", phone: "+254 743 471227", role: "Athi River / Kitengela Driver" },
    ],
  },
  {
    county: "Kajiado",
    town: "Ngong",
    slug: "ngong",
    population: "200,000+",
    description: "Ngong Town, Ongata Rongai, and Kiserian transport network providing reliable direct rides to Karen, Nairobi, and Kajiado.",
    keywords: [
      "taxi Ngong",
      "car hire Ngong",
      "Ngong taxi service",
      "Ongata Rongai taxi",
      "Kiserian taxi",
      "Ngong to Nairobi taxi"
    ],
    subLocations: ["Ngong CBD", "Ongata Rongai", "Kiserian", "Matasia", "Kahuho"],
    directContacts: [
      { name: "Geoffrey", phone: "+254 791 374281", whatsapp: "+254 791 374281", role: "Ngong / Rongai Driver" },
    ],
  },

  // 5. KITUI COUNTY
  {
    county: "Kitui",
    town: "Kitui Town",
    slug: "kitui-town",
    population: "150,000+",
    description: "Kitui Town administrative and commercial center with direct local drivers for town trips and inter-county journeys to Nairobi and Machakos.",
    keywords: [
      "taxi Kitui",
      "car hire Kitui",
      "Kitui taxi service",
      "Kitui car rental",
      "taxi from Kitui to Nairobi",
      "Kitui town transport"
    ],
    subLocations: ["Kitui CBD", "Kwa Vonza", "Kalundu", "Manyenyoni", "Matinyani", "Kabati"],
    directContacts: [
      { name: "Christopher Kavwele", phone: "+254 728 860376", role: "Kitui Regional Driver" },
      { name: "Kimuyu", phone: "+254 720 599970", role: "Kitui Driver" },
    ],
  },
  {
    county: "Kitui",
    town: "Mwingi",
    slug: "mwingi",
    population: "100,000+",
    description: "Mwingi Town major transit corridor linking Kitui to Garissa highway with dependable direct driver services.",
    keywords: [
      "taxi Mwingi",
      "car hire Mwingi",
      "Mwingi taxi service",
      "Mwingi car rental",
      "taxi Mwingi to Nairobi",
      "Mwingi transport"
    ],
    subLocations: ["Mwingi CBD", "Waita", "Nguni", "Migwani"],
    directContacts: [
      { name: "Christopher Kavwele", phone: "+254 728 860376", role: "Kitui / Mwingi Driver" },
    ],
  },

  // 6. MAKUENI COUNTY
  {
    county: "Makueni",
    town: "Wote",
    slug: "wote",
    population: "100,000+",
    description: "Wote capital of Makueni County providing verified direct taxi and car hire services for business, agriculture, and inter-town travel.",
    keywords: [
      "taxi Wote",
      "car hire Makueni",
      "Wote taxi service",
      "Wote car rental",
      "taxi Wote town",
      "Makueni transport"
    ],
    subLocations: ["Wote CBD", "Unkoa", "Kaiti", "Malivani"],
    directContacts: [
      { name: "Bosco Muoka", phone: "+254 706 167329", role: "Makueni Driver" },
      { name: "Nicholas Mutisya", phone: "+254 710 122800", role: "Ukambani Corridor Driver" },
    ],
  },
  {
    county: "Makueni",
    town: "Makindu & Kibwezi",
    slug: "makindu-kibwezi",
    population: "120,000+",
    description: "Makindu, Kibwezi, Mtito Andei, and Sultan Hamud corridor along Nairobi-Mombasa highway with direct driver connections.",
    keywords: [
      "taxi Makindu",
      "taxi Kibwezi",
      "taxi Mtito Andei",
      "car hire Makindu",
      "Sultan Hamud taxi",
      "Makueni highway transport"
    ],
    subLocations: ["Makindu", "Kibwezi", "Mtito Andei", "Emali", "Sultan Hamud", "Salama"],
    directContacts: [
      { name: "Bosco Muoka", phone: "+254 706 167329", role: "Makueni Driver" },
      { name: "Nicholas Mutisya", phone: "+254 710 122800", role: "Highway Corridor Driver" },
    ],
  },
];

export function getAllLocations(): LocationInfo[] {
  return OPERATIONAL_LOCATIONS;
}

export function getLocationBySlug(slug: string): LocationInfo | undefined {
  return OPERATIONAL_LOCATIONS.find((loc) => loc.slug === slug);
}

export function getLocationsByCounty(county: string): LocationInfo[] {
  return OPERATIONAL_LOCATIONS.filter(
    (loc) => loc.county.toLowerCase() === county.toLowerCase()
  );
}

export function getCountiesWithLocations(): string[] {
  const counties = new Set(OPERATIONAL_LOCATIONS.map((loc) => loc.county));
  return Array.from(counties).sort();
}

export function getLocationPageMeta(location: LocationInfo) {
  const primaryPhone = location.directContacts?.[0]?.phone;
  const phoneText = primaryPhone ? `Call direct: ${primaryPhone}.` : "Professional local drivers.";

  return {
    title: `Taxi & Car Hire in ${location.town}, ${location.county} | Direct Driver Booking | TaxiTao`,
    description: `Book direct taxi and car hire in ${location.town}, ${location.county}. ${phoneText} Fast dispatch, transparent pricing.`,
    keywords: location.keywords.join(", "),
  };
}

export function getVehicleServiceCountyField(): string {
  return "serviceCounty";
}

export function getVehicleServiceTownField(): string {
  return "serviceTown";
}
