export interface ZttResponse<T> {
  status: string;
  message: string;
  data?: T;
  body?: T;
}

export interface ZttErrorResponse {
  status: string;
  message: string;
  code: number;
}

interface GraphQLError {
  message: string;
  locations: object[]; // eslint-disable-line @typescript-eslint/ban-types
  path: object[]; // eslint-disable-line @typescript-eslint/ban-types
  extensions?: object; // eslint-disable-line @typescript-eslint/ban-types
}

export interface GraphQLResponse<T> {
  data: T;
  errors: GraphQLError[];
}
