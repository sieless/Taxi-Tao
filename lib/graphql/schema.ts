export const typeDefs = /* GraphQL */ `
  scalar DateTime
  scalar JSON

  type Query {
    vehicles(status: String, search: String, limit: Int, offset: Int): VehicleConnection!
    vehicle(id: ID!): Vehicle
    vendorDashboard: VendorDashboard!
    hireRequests(status: String, limit: Int, offset: Int): HireRequestConnection!
    adminCompanies: [Company!]!
    appCrashes: [AppCrash!]!
    shareLinks: [ShareLink!]!
    auditLogs(category: String, severity: String, limit: Int, cursor: String): AuditLogConnection!
    customerDashboard: CustomerDashboard!
    driverBookings: [DriverBooking!]!
    companyProfile(id: ID): CompanyProfile!
  }

  type Mutation {
    publishVehicle(id: ID!): Vehicle!
    batchPublishVehicles: BatchPublishResult!
    deleteVehicle(id: ID!): Boolean!
    updateCompanyStatus(id: ID!, status: String!): Company!
    toggleCorporate(id: ID!, isCorporate: Boolean!): Company!
    resolveCrash(id: ID!): AppCrash!
    toggleShareLinkActive(id: ID!): ShareLink!
    deleteShareLink(id: ID!): Boolean!
    updateCompanyProfile(input: UpdateCompanyProfileInput!): CompanyProfile!
  }

  input UpdateCompanyProfileInput {
    id: ID
    name: String!
    phone: String
    email: String
    logoUrl: String
    incorporationDocUrl: String
    address: String
    bio: String
  }

  type VehicleConnection {
    items: [Vehicle!]!
    total: Int!
    hasMore: Boolean!
  }

  type Vehicle {
    id: ID!
    make: String!
    model: String!
    year: Int!
    plateNumber: String!
    status: String!
    color: String
    fuelType: String
    transmission: String
    seatingCapacity: Int
    dailyRate: Float
    imageUrls: [String!]
    companyId: String
    createdBy: String
    createdAt: DateTime
    updatedAt: DateTime
  }

  type HireRequestConnection {
    items: [HireRequest!]!
    total: Int!
    hasMore: Boolean!
  }

  type HireRequest {
    id: ID!
    customerId: String!
    companyId: String!
    vehicleId: String!
    status: String!
    startDate: String!
    endDate: String!
    pickupLocation: String
    dropoffLocation: String
    totalAmount: Float
    createdAt: DateTime
  }

  type VendorDashboard {
    totalVehicles: Int!
    activeVehicles: Int!
    onTripVehicles: Int!
    draftVehicles: Int!
    totalHireRequests: Int!
    activeHires: Int!
    pendingApprovals: Int!
  }

  type BatchPublishResult {
    published: Int!
    failed: Int!
  }

  type Company {
    id: ID!
    name: String!
    contactEmail: String
    contactPhone: String
    location: String
    status: String
    isCorporate: Boolean
    subscriptionTier: String
    subscriptionStatus: String
    driverCount: Int
    vehicleCount: Int
    createdAt: DateTime
  }

  type AppCrash {
    id: ID!
    message: String
    stack: String
    userId: String
    platform: String
    appVersion: String
    severity: String
    resolved: Boolean
    resolvedBy: String
    timestamp: DateTime
    count: Int
  }

  type ShareLink {
    id: ID!
    code: String!
    driverId: String
    driverName: String
    type: String
    active: Boolean
    clicks: Int
    conversions: Int
    createdAt: DateTime
    expiresAt: DateTime
  }

  type AuditLog {
    id: ID!
    actorEmail: String
    actorUid: String
    action: String!
    category: String
    severity: String
    targetId: String
    targetType: String
    description: String
    timestamp: DateTime
    metadata: JSON
  }

  type AuditLogConnection {
    items: [AuditLog!]!
    total: Int!
    hasMore: Boolean!
    cursor: String
  }

  type CustomerBooking {
    id: ID!
    pickupLocation: String
    destination: String
    pickupDate: String
    pickupTime: String
    status: String
    rideStatus: String
    createdAt: DateTime
  }

  type CustomerDashboard {
    recentBookings: [CustomerBooking!]!
    total: Int!
    active: Int!
    completed: Int!
  }

  type DriverBooking {
    id: ID!
    pickupLocation: String
    destination: String
    status: String
    rideStatus: String
    customerName: String
    customerPhone: String
    fare: Float
    createdAt: DateTime
  }

  type CompanyProfile {
    id: ID!
    name: String!
    phone: String
    email: String
    logoUrl: String
    incorporationDocUrl: String
    address: String
    bio: String
  }
`;
