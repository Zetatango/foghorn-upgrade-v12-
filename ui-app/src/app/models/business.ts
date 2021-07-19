export interface Business {
  name: string;
  phone_number: string;
  industry: string;
  avg_monthly_sales?: number;
  doing_business_as?: string;
  incorporated_in?: string;
  business_num?: string;
  owner_since?: Date;
  self_attested_date_established?: Date;
  self_attested_average_monthly_sales?: number;
}
