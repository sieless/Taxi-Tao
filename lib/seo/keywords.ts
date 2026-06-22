export interface KeywordCluster {
  topic: string;
  primary: string[];
  longTail: string[];
}

export function getKeywordClusters(): KeywordCluster[] {
  return [
    {
      topic: "ride-hailing",
      primary: [
        "taxi near me Kenya",
        "book taxi online Kenya",
        "taxi service Machakos",
        "cheap taxi Kenya",
        "reliable taxi service",
        "taxi app Kenya",
      ],
      longTail: [
        "best taxi service in Machakos town",
        "how to book a taxi online in Kenya",
        "affordable taxi rates in Kenya per km",
        "24 hour taxi service near me Kenya",
        "taxi from Nairobi to Machakos price",
        "safe taxi for women Kenya",
      ],
    },
    {
      topic: "car-hire",
      primary: [
        "car hire Kenya",
        "self drive car rental Kenya",
        "car rental for wedding Kenya",
        "luxury car hire Nairobi",
        "affordable car rental Kenya",
      ],
      longTail: [
        "car hire with driver Kenya rates",
        "best car rental companies in Kenya 2026",
        "self drive car hire Nairobi without deposit",
        "SUV rental for safari Kenya price",
        "long term car hire Kenya monthly rates",
        "car hire for wedding in Machakos",
      ],
    },
    {
      topic: "vehicle-types",
      primary: [
        "Toyota Fielder for hire",
        "Mercedes C200 rental",
        "Toyota HiAce hire",
        "saloon car hire Kenya",
        "7 seater car rental",
      ],
      longTail: [
        "Toyota Fielder self drive Kenya price",
        "Mercedes C200 hire for wedding Kenya",
        "Toyota HiAce minibus hire for events",
        "executive car hire Nairobi airport",
        "automatic car rental Kenya rates",
      ],
    },
    {
      topic: "location",
      primary: [
        "Machakos taxi service",
        "Nairobi taxi online",
        "Mombasa car hire",
        "Kisumu taxi booking",
        "Nakuru car rental",
        "Eldoret taxi service",
        "Thika car hire",
      ],
      longTail: [
        "taxi from Machakos to Nairobi price today",
        "car hire in Mombasa for self drive",
        "best taxi service in Kisumu town",
        "Nakuru to Nairobi taxi fare",
        "Eldoret airport taxi transfer",
        "Thika to Nairobi daily taxi rates",
      ],
    },
    {
      topic: "swahili",
      primary: [
        "teksi karibu nami",
        "kukodi gari Kenya",
        "bei ya teksi Kenya",
        "huduma za usafiri Kenya",
        "nafasi za kazi taxi Kenya",
      ],
      longTail: [
        "namna ya kukodi gari online Kenya",
        "bei ya kukodi gari Machakos",
        "huduma ya teksi 24 saa Kenya",
        "kampuni bora ya teksi Kenya",
        "gharama ya safari kwa teksi",
      ],
    },
    {
      topic: "services",
      primary: [
        "transport service Kenya",
        "hearse service Kenya",
        "funeral transport Kenya",
        "corporate transport Kenya",
        "event transport Kenya",
      ],
      longTail: [
        "funeral hearse hire services Kenya prices",
        "corporate shuttle service for employees Kenya",
        "group transport for events Nairobi",
        "school transport service Machakos",
        "hospital transport service Kenya",
      ],
    },
  ];
}

export function getPrimaryKeywordsByTopic(topic: string): string[] {
  const cluster = getKeywordClusters().find((c) => c.topic === topic);
  return cluster?.primary ?? [];
}

export function getLocationKeywords(county: string, town: string): string[] {
  return [
    `taxi ${town}`,
    `car hire ${town}`,
    `taxi service in ${town} ${county}`,
    `${town} taxi booking online`,
    `cheap taxi ${town} ${county}`,
    `${town} car rental services`,
    `taxi from ${town} to Nairobi`,
    `self drive car hire ${town}`,
    `best taxi in ${town} ${county}`,
    `24 hour taxi ${town}`,
  ];
}
