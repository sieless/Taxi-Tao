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

export const ADMIN_COMPANIES_QUERY = `
  query AdminCompanies {
    adminCompanies {
      id
      name
      contactEmail
      contactPhone
      location
      status
      isCorporate
      subscriptionTier
      subscriptionStatus
      driverCount
      vehicleCount
      createdAt
    }
  }
`;

export const UPDATE_COMPANY_STATUS_MUTATION = `
  mutation UpdateCompanyStatus($id: ID!, $status: String!) {
    updateCompanyStatus(id: $id, status: $status) {
      id
      status
    }
  }
`;

export const TOGGLE_CORPORATE_MUTATION = `
  mutation ToggleCorporate($id: ID!, $isCorporate: Boolean!) {
    toggleCorporate(id: $id, isCorporate: $isCorporate) {
      id
      isCorporate
    }
  }
`;

export const APP_CRASHES_QUERY = `
  query AppCrashes($platform: String, $severity: String, $status: String) {
    appCrashes(platform: $platform, severity: $severity, status: $status) {
      id
      message
      stack
      errorType
      errorName
      userId
      userRole
      platform
      appVersion
      osVersion
      deviceModel
      buildNumber
      screen
      userAction
      componentStack
      sessionId
      severity
      isFatal
      resolved
      resolvedBy
      resolvedAt
      timestamp
      count
      category
    }
  }
`;

export const RESOLVE_CRASH_MUTATION = `
  mutation ResolveCrash($id: ID!) {
    resolveCrash(id: $id) {
      id
      resolved
    }
  }
`;

export const SHARE_LINKS_QUERY = `
  query ShareLinks {
    shareLinks {
      id
      code
      driverId
      driverName
      type
      active
      clicks
      conversions
      createdAt
      expiresAt
    }
  }
`;

export const TOGGLE_SHARE_LINK_MUTATION = `
  mutation ToggleShareLinkActive($id: ID!) {
    toggleShareLinkActive(id: $id) {
      id
      active
    }
  }
`;

export const DELETE_SHARE_LINK_MUTATION = `
  mutation DeleteShareLink($id: ID!) {
    deleteShareLink(id: $id)
  }
`;

export const AUDIT_LOGS_QUERY = `
  query AuditLogs($category: String, $severity: String, $limit: Int, $cursor: String) {
    auditLogs(category: $category, severity: $severity, limit: $limit, cursor: $cursor) {
      items {
        id
        actorEmail
        actorUid
        action
        category
        severity
        targetId
        targetType
        description
        timestamp
      }
      hasMore
      cursor
    }
  }
`;

export const CUSTOMER_DASHBOARD_QUERY = `
  query CustomerDashboard {
    customerDashboard {
      recentBookings {
        id
        pickupLocation
        destination
        pickupDate
        pickupTime
        status
        rideStatus
        createdAt
      }
      total
      active
      completed
    }
  }
`;

export const DRIVER_BOOKINGS_QUERY = `
  query DriverBookings {
    driverBookings {
      id
      pickupLocation
      destination
      status
      rideStatus
      customerName
      customerPhone
      fare
      createdAt
    }
  }
`;

export const COMPANY_PROFILE_QUERY = `
  query CompanyProfile($id: ID) {
    companyProfile(id: $id) {
      id
      name
      phone
      email
      logoUrl
      incorporationDocUrl
      address
      bio
    }
  }
`;

export const UPDATE_COMPANY_PROFILE_MUTATION = `
  mutation UpdateCompanyProfile($input: UpdateCompanyProfileInput!) {
    updateCompanyProfile(input: $input) {
      id
      name
      phone
      email
      logoUrl
      incorporationDocUrl
      address
      bio
    }
  }
`;
