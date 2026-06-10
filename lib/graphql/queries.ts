export const VEHICLES_QUERY = `
  query Vehicles($status: String, $search: String, $limit: Int, $offset: Int) {
    vehicles(status: $status, search: $search, limit: $limit, offset: $offset) {
      items {
        id
        make
        model
        year
        plateNumber
        status
        color
        fuelType
        transmission
        seatingCapacity
        dailyRate
        imageUrls
        createdAt
        updatedAt
      }
      total
      hasMore
    }
  }
`;

export const VENDOR_DASHBOARD_QUERY = `
  query VendorDashboard {
    vendorDashboard {
      totalVehicles
      activeVehicles
      onTripVehicles
      draftVehicles
      totalHireRequests
      activeHires
      pendingApprovals
    }
  }
`;

export const PUBLISH_VEHICLE_MUTATION = `
  mutation PublishVehicle($id: ID!) {
    publishVehicle(id: $id) {
      id
      status
    }
  }
`;

export const BATCH_PUBLISH_MUTATION = `
  mutation BatchPublishVehicles {
    batchPublishVehicles {
      published
      failed
    }
  }
`;

export const DELETE_VEHICLE_MUTATION = `
  mutation DeleteVehicle($id: ID!) {
    deleteVehicle(id: $id)
  }
`;

export const HIRE_REQUESTS_QUERY = `
  query HireRequests($status: String, $limit: Int, $offset: Int) {
    hireRequests(status: $status, limit: $limit, offset: $offset) {
      items {
        id
        customerId
        companyId
        vehicleId
        status
        startDate
        endDate
        pickupLocation
        dropoffLocation
        totalAmount
        createdAt
      }
      total
      hasMore
    }
  }
`;
