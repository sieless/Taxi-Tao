export const typeDefs = /* GraphQL */ `
  scalar DateTime
  scalar JSON

  type Query {
    vehicles(status: String, search: String, limit: Int, offset: Int): VehicleConnection!
    vehicle(id: ID!): Vehicle
    vendorDashboard: VendorDashboard!
    hireRequests(status: String, limit: Int, offset: Int): HireRequestConnection!
  }

  type Mutation {
    publishVehicle(id: ID!): Vehicle!
    batchPublishVehicles: BatchPublishResult!
    deleteVehicle(id: ID!): Boolean!
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
`;
