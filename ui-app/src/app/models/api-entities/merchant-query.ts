// Body for POST /merchant_queries
export interface MerchantQueryPost {
  name: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state_province: string;
  postal_code: string;
  country: string;
  phone_number: string;
}

// Response from POST /merchant_queries
export interface MerchantQueryResponse {
  query_id: string;
  results: Array<VerifiedBusiness>;
}

export interface VerifiedBusiness {
  id: string;
  name: string;
  phone_number: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state_province: string;
  postal_code: string;
  country: string;
}

// Body for POST /merchant_queries/select
export interface MerchantQuerySelectPost {
  query_id: string;
  business_id: string;
  industry: string;
  doing_business_as: string;
  business_num?: string;
  incorporated_in?: string;
  lead_guid?: string;
  owner_since?: string;
  self_attested_date_established: string;
  self_attested_average_monthly_sales: number;
}
