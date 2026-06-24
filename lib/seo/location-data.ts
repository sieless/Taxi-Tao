export interface LocationInfo {
  county: string;
  town: string;
  slug: string;
  population?: string;
  description?: string;
  keywords: string[];
  subLocations: string[];
}

const PHASE_1_LOCATIONS: LocationInfo[] = [
  {
    county: "Machakos",
    town: "Machakos Town",
    slug: "machakos-town",
    population: "200,000+",
    description: "Machakos Town is the capital of Machakos County, a major transport hub linking Nairobi to Ukambani region.",
    keywords: ["taxi Machakos", "car hire Machakos", "Machakos taxi service", "Machakos car rental", "taxi from Machakos to Nairobi", "Machakos town transport"],
    subLocations: ["Machakos CBD", "Masii", "Kangundo", "Athi River", "Mlolongo", "Syokimau", "Kathiani", "Tala"],
  },
  {
    county: "Machakos",
    town: "Athi River",
    slug: "athi-river",
    population: "150,000+",
    description: "Athi River is a growing industrial and residential town along the Nairobi-Mombasa highway in Machakos County.",
    keywords: ["taxi Athi River", "car hire Athi River", "Athi River taxi service", "Athi River car rental", "Mlolongo taxi", "Syokimau taxi"],
    subLocations: ["Mlolongo", "Syokimau", "Kitengela", "Athi River CBD", "Estey"],
  },
  {
    county: "Nairobi",
    town: "Nairobi CBD",
    slug: "nairobi-cbd",
    population: "5,000,000+",
    description: "Nairobi CBD is the commercial heart of Kenya's capital city, served by TaxiTao's extensive taxi and car hire network.",
    keywords: ["taxi Nairobi", "car hire Nairobi", "Nairobi taxi booking", "Nairobi car rental", "Nairobi to airport taxi", "Nairobi executive car hire"],
    subLocations: ["Westlands", "Upper Hill", "Kilimani", "Lavington", "Kileleshwa", "South B", "South C", "Lang'ata", "Karen", "Ngong Road"],
  },
  {
    county: "Nairobi",
    town: "Westlands",
    slug: "westlands",
    population: "300,000+",
    description: "Westlands is Nairobi's premier business and entertainment district, with high demand for executive taxi and car hire services.",
    keywords: ["taxi Westlands Nairobi", "car hire Westlands", "Westlands taxi service", "Westlands car rental", "Westlands to airport"],
    subLocations: ["Westlands CBD", "Parklands", "Highridge", "Windsor"],
  },
  {
    county: "Mombasa",
    town: "Mombasa CBD",
    slug: "mombasa-cbd",
    population: "1,200,000+",
    description: "Mombasa CBD is the coastal commercial hub of Kenya, serving tourists and businesses with reliable taxi and car hire services.",
    keywords: ["taxi Mombasa", "car hire Mombasa", "Mombasa taxi service", "Mombasa car rental", "Mombasa airport taxi", "Mombasa self drive"],
    subLocations: ["Nyali", "Bamburi", "Likoni", "Changamwe", "Kisauni", "Tudor", "Mikindani"],
  },
  {
    county: "Kisumu",
    town: "Kisumu Town",
    slug: "kisumu-town",
    population: "500,000+",
    description: "Kisumu Town is the lakeside capital of Nyanza region, offering taxi and car hire services for business and tourism.",
    keywords: ["taxi Kisumu", "car hire Kisumu", "Kisumu taxi service", "Kisumu car rental", "Kisumu airport transfer", "taxi Kisumu town"],
    subLocations: ["Kisumu CBD", "Milimani", "Migosi", "Kondele", "Manyatta", "Nyalenda", "Kibos"],
  },
  {
    county: "Nakuru",
    town: "Nakuru Town",
    slug: "nakuru-town",
    population: "600,000+",
    description: "Nakuru Town is the Rift Valley's commercial hub, with TaxiTao providing reliable transport services across the city.",
    keywords: ["taxi Nakuru", "car hire Nakuru", "Nakuru taxi service", "Nakuru car rental", "Nakuru town transport", "taxi Nakuru CBD"],
    subLocations: ["Nakuru CBD", "Milimani", "Lanet", "Njoro", "Naivasha", "Molo", "Mau Summit"],
  },
  {
    county: "Uasin Gishu",
    town: "Eldoret Town",
    slug: "eldoret-town",
    population: "500,000+",
    description: "Eldoret Town is a major agricultural and academic center in the North Rift, served by TaxiTao's professional transport network.",
    keywords: ["taxi Eldoret", "car hire Eldoret", "Eldoret taxi service", "Eldoret car rental", "Eldoret airport transfer", "taxi Eldoret town"],
    subLocations: ["Eldoret CBD", "Kapsoya", "Langas", "Huruma", "Kipkenyo", "Pioneer", "Ngeria"],
  },
  {
    county: "Kericho",
    town: "Kericho Town",
    slug: "kericho-town",
    population: "200,000+",
    description: "Kericho Town is the tea-growing capital of Kenya, with TaxiTao providing dependable taxi and car hire services.",
    keywords: ["taxi Kericho", "car hire Kericho", "Kericho taxi service", "Kericho car rental", "Kericho town taxi", "taxi Kericho county"],
    subLocations: ["Kericho CBD", "Kapkatet", "Londiani", "Sotik", "Bomet", "Kipkelion"],
  },
  {
    county: "Kiambu",
    town: "Thika",
    slug: "thika",
    population: "300,000+",
    description: "Thika is an industrial town in Kiambu County, with TaxiTao providing fast and affordable taxi and car hire services.",
    keywords: ["taxi Thika", "car hire Thika", "Thika taxi service", "Thika car rental", "Thika to Nairobi taxi", "taxi Thika town"],
    subLocations: ["Thika CBD", "Juja", "Ruiru", "Gatundu", "Ruiru", "Kenol", "Makongeni"],
  },
  {
    county: "Kilifi",
    town: "Malindi",
    slug: "malindi",
    population: "200,000+",
    description: "Malindi is a popular coastal tourist destination, with TaxiTao offering reliable taxi and car hire for visitors and residents.",
    keywords: ["taxi Malindi", "car hire Malindi", "Malindi taxi service", "Malindi car rental", "Malindi airport taxi", "Malindi tourist transport"],
    subLocations: ["Malindi CBD", "Watamu", "Kilifi Town", "Mambrui", "Gede", "Marafa"],
  },
  {
    county: "Trans Nzoia",
    town: "Kitale",
    slug: "kitale",
    population: "150,000+",
    description: "Kitale is the agricultural hub of the North Rift, offering reliable taxi and car hire services through TaxiTao.",
    keywords: ["taxi Kitale", "car hire Kitale", "Kitale taxi service", "Kitale car rental", "Kitale town transport", "taxi Kitale Trans Nzoia"],
    subLocations: ["Kitale CBD", "Sirende", "Matunda", "Endebess", "Kiminini", "Saboti"],
  },
  {
    county: "Garissa",
    town: "Garissa Town",
    slug: "garissa-town",
    population: "200,000+",
    description: "Garissa Town is the capital of Garissa County in North Eastern Kenya, with TaxiTao connecting residents to reliable transport.",
    keywords: ["taxi Garissa", "car hire Garissa", "Garissa taxi service", "Garissa car rental", "Garissa town taxi", "taxi Garissa county"],
    subLocations: ["Garissa CBD", "Dujis", "Lagdera", "Balambala", "Iftin", "Modogashe"],
  },
  {
    county: "Nairobi",
    town: "Karen",
    slug: "karen",
    population: "200,000+",
    description: "Karen is an upscale suburb of Nairobi known for its leafy residential areas and the Karen Blixen Museum.",
    keywords: ["taxi Karen Nairobi", "car hire Karen", "Karen taxi service", "Karen car rental", "Karen to airport taxi", "executive taxi Karen"],
    subLocations: ["Karen CBD", "Lang'ata", "Ole Sereni", "Hardy", "Bogani", "Magadi Road"],
  },
  {
    county: "Kajiado",
    town: "Ngong",
    slug: "ngong",
    population: "200,000+",
    description: "Ngong Town sits at the foot of the Ngong Hills, serving as a key transport link between Nairobi and Kajiado County.",
    keywords: ["taxi Ngong", "car hire Ngong", "Ngong taxi service", "Ngong car rental", "Ngong to Nairobi taxi", "taxi Ngong town"],
    subLocations: ["Ngong CBD", "Ongata Rongai", "Kiserian", "Matasia", "Lenana", "Karen-Ngong"],
  },
];

export function getAllLocations(): LocationInfo[] {
  return PHASE_1_LOCATIONS;
}

export function getLocationBySlug(slug: string): LocationInfo | undefined {
  return PHASE_1_LOCATIONS.find((loc) => loc.slug === slug);
}

export function getLocationsByCounty(county: string): LocationInfo[] {
  return PHASE_1_LOCATIONS.filter(
    (loc) => loc.county.toLowerCase() === county.toLowerCase()
  );
}

export function getCountiesWithLocations(): string[] {
  const counties = new Set(PHASE_1_LOCATIONS.map((loc) => loc.county));
  return Array.from(counties).sort();
}

export function getLocationPageMeta(location: LocationInfo) {
  return {
    title: `Taxi & Car Hire in ${location.town}, ${location.county} | TaxiTao`,
    description: `Book reliable taxi and car hire services in ${location.town}, ${location.county}. Professional drivers, well-maintained vehicles, 24/7 support. Call +254 710 450 640.`,
    keywords: location.keywords.join(", "),
  };
}

export function getVehicleServiceCountyField(): string {
  return "serviceCounty";
}

export function getVehicleServiceTownField(): string {
  return "serviceTown";
}
