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
  {
    county: "Meru",
    town: "Meru Town",
    slug: "meru-town",
    population: "300,000+",
    description: "Meru Town is the commercial and administrative hub of Meru County at the base of Mount Kenya, served by TaxiTao's reliable transport network.",
    keywords: ["taxi Meru", "car hire Meru", "Meru taxi service", "Meru car rental", "Meru to Nairobi taxi", "taxi Meru town"],
    subLocations: ["Meru CBD", "Gatimbi", "Kaaga", "Makutano", "Nkubu", "Timau"],
  },
  {
    county: "Nyeri",
    town: "Nyeri Town",
    slug: "nyeri-town",
    population: "200,000+",
    description: "Nyeri Town is the central hub of Kenya's Central Highlands, offering taxi and car hire services to residents and tourists visiting the Aberdares.",
    keywords: ["taxi Nyeri", "car hire Nyeri", "Nyeri taxi service", "Nyeri car rental", "Nyeri to Nairobi taxi", "taxi Nyeri town"],
    subLocations: ["Nyeri CBD", "King'ong'o", "Tetu", "Mukurwe-ini", "Othaya", "Karatina"],
  },
  {
    county: "Kakamega",
    town: "Kakamega Town",
    slug: "kakamega-town",
    population: "250,000+",
    description: "Kakamega Town is the capital of Kakamega County in Western Kenya, known for the nearby Kakamega Forest, with TaxiTao providing dependable transport.",
    keywords: ["taxi Kakamega", "car hire Kakamega", "Kakamega taxi service", "Kakamega car rental", "taxi Kakamega town", "Kakamega to Kisumu taxi"],
    subLocations: ["Kakamega CBD", "Lurambi", "Shinyalu", "Mumias", "Butere", "Malava"],
  },
  {
    county: "Bungoma",
    town: "Bungoma Town",
    slug: "bungoma-town",
    population: "200,000+",
    description: "Bungoma Town is the capital of Bungoma County in Western Kenya, a key agricultural and transport hub served by TaxiTao.",
    keywords: ["taxi Bungoma", "car hire Bungoma", "Bungoma taxi service", "Bungoma car rental", "taxi Bungoma town", "Bungoma to Nairobi taxi"],
    subLocations: ["Bungoma CBD", "Chwele", "Kimilili", "Webuye", "Siritany", "Kanduyi"],
  },
  {
    county: "Nandi",
    town: "Kapsabet",
    slug: "kapsabet",
    population: "150,000+",
    description: "Kapsabet is the capital of Nandi County in the Rift Valley, known for its athletics heritage and served by TaxiTao's transport services.",
    keywords: ["taxi Kapsabet", "car hire Kapsabet", "Kapsabet taxi service", "Kapsabet car rental", "taxi Kapsabet town", "Nandi transport"],
    subLocations: ["Kapsabet CBD", "Nandi Hills", "Mosoriot", "Kabisaga", "Kobujoi", "Tinderet"],
  },
  {
    county: "Lamu",
    town: "Lamu Town",
    slug: "lamu-town",
    population: "100,000+",
    description: "Lamu Town is a UNESCO World Heritage Site on Kenya's coast, with TaxiTao offering reliable transport for tourists exploring Lamu Island.",
    keywords: ["taxi Lamu", "car hire Lamu", "Lamu taxi service", "Lamu car rental", "Lamu airport transfer", "Lamu tourist transport"],
    subLocations: ["Lamu Old Town", "Shella", "Manda", "Mpeketoni", "Kizingo", "Faza"],
  },
  {
    county: "Makueni",
    town: "Wote",
    slug: "wote",
    population: "100,000+",
    description: "Wote is the capital of Makueni County in Eastern Kenya, providing taxi and car hire services for residents and businesses in the region.",
    keywords: ["taxi Wote", "car hire Makueni", "Wote taxi service", "Wote car rental", "taxi Wote town", "Makueni transport"],
    subLocations: ["Wote CBD", "Makindu", "Sultan Hamud", "Emali", "Kibwezi", "Mtito Andei"],
  },
  {
    county: "Murang'a",
    town: "Murang'a Town",
    slug: "muranga-town",
    population: "150,000+",
    description: "Murang'a Town is the capital of Murang'a County in Central Kenya, a key agricultural hub served by TaxiTao's transport network.",
    keywords: ["taxi Murang'a", "car hire Murang'a", "Murang'a taxi service", "Murang'a car rental", "taxi Murang'a town", "Murang'a to Nairobi taxi"],
    subLocations: ["Murang'a CBD", "Kangari", "Kigumo", "Kandara", "Gatanga", "Maragua"],
  },
  {
    county: "Kirinyaga",
    town: "Kerugoya",
    slug: "kerugoya",
    population: "100,000+",
    description: "Kerugoya is the capital of Kirinyaga County in Central Kenya, serving the fertile rice-growing region with reliable taxi services.",
    keywords: ["taxi Kerugoya", "car hire Kirinyaga", "Kerugoya taxi service", "Kerugoya car rental", "taxi Kerugoya town", "Kirinyaga transport"],
    subLocations: ["Kerugoya CBD", "Kutus", "Sagana", "Baricho", "Mwea", "Ngariama"],
  },
  {
    county: "Taita Taveta",
    town: "Voi",
    slug: "voi",
    population: "100,000+",
    description: "Voi is the gateway town to Tsavo National Parks in Taita Taveta County, with TaxiTao providing transport for tourists and residents.",
    keywords: ["taxi Voi", "car hire Voi", "Voi taxi service", "Voi car rental", "Voi to Mombasa taxi", "Tsavo transport"],
    subLocations: ["Voi CBD", "Taveta", "Mwatate", "Wundanyi", "Mbale", "Sagala"],
  },
  {
    county: "Laikipia",
    town: "Nanyuki",
    slug: "nanyuki",
    population: "100,000+",
    description: "Nanyuki is a busy town on the equator at the foot of Mount Kenya, serving the Laikipia tourism and agricultural region.",
    keywords: ["taxi Nanyuki", "car hire Nanyuki", "Nanyuki taxi service", "Nanyuki car rental", "Nanyuki to Nairobi taxi", "Mount Kenya transport"],
    subLocations: ["Nanyuki CBD", "Rumuruti", "Nyahururu", "Doldol", "Timau", "Mukogodo"],
  },
  {
    county: "Narok",
    town: "Narok Town",
    slug: "narok-town",
    population: "100,000+",
    description: "Narok Town is the gateway to the Maasai Mara Game Reserve, with TaxiTao offering reliable transport for safari tourism.",
    keywords: ["taxi Narok", "car hire Narok", "Narok taxi service", "Narok car rental", "Maasai Mara taxi", "Narok to Nairobi taxi"],
    subLocations: ["Narok CBD", "Kilgoris", "Lemek", "Ololulunga", "Suswa", "Ewaso Nyiro"],
  },
  {
    county: "Nairobi",
    town: "Kilimani",
    slug: "kilimani",
    population: "200,000+",
    description: "Kilimani is an upscale residential and commercial neighborhood in Nairobi with high demand for executive taxi and car hire services.",
    keywords: ["taxi Kilimani", "car hire Kilimani", "Kilimani taxi service", "Kilimani car rental", "Kilimani to airport taxi", "executive taxi Nairobi"],
    subLocations: ["Kilimani CBD", "Adams Arcade", "Woodley", "Mountain View", "Kileleshwa", "Hurlingham"],
  },
  {
    county: "Mombasa",
    town: "Nyali",
    slug: "nyali",
    population: "200,000+",
    description: "Nyali is an upscale coastal suburb of Mombasa known for its beaches, hotels, and residential estates, served by TaxiTao's premium transport.",
    keywords: ["taxi Nyali Mombasa", "car hire Nyali", "Nyali taxi service", "Nyali car rental", "Nyali beach taxi", "Nyali to airport taxi"],
    subLocations: ["Nyali CBD", "Mkomani", "Bamburi", "Mtopanga", "Kongowea", "Frere Town"],
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
    description: `Book reliable taxi and car hire services in ${location.town}, ${location.county}. Professional drivers, well-maintained vehicles, 24/7 support. Call +254 708 674 665.`,
    keywords: location.keywords.join(", "),
  };
}

export function getVehicleServiceCountyField(): string {
  return "serviceCounty";
}

export function getVehicleServiceTownField(): string {
  return "serviceTown";
}
