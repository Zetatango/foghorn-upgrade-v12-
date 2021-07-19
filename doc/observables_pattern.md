# Foghorn Observable Pattern

## Observable Types
1. **One-Way Observables** - these will be used to store API responses
	1. Only the API calls on the services call the SET operation on the Observable
	2. Components and services alike make call the SET operation on the Observable
2. **Two-Way Observables** - these are mutable objects updated via user interaction or side effects of user interaction
	1. Components may both get and set the Observable

## Observables in Services 
* Services make calls to the API to retrieve data that the client needs (i.e. lending applications, ubls, etc.)
* Service methods that make calls to the API should return an Observable of type: Observable<HttpEvent<SOME ENTITY | ErrorEvent>>
* Services store private BehaviorSubject attributes for components to subscribe to via a getter method
* All service methods should distinguish between the following method verbs:
	* SET should be reserved for setting the BehaviorSubject in the service
	* GET should be reserved for retrieving and subscribing to the BehaviorSubject from the service
	* LOAD or RETRIEVE should be reserved for naming methods that make a GET operation against an API endpoint
	* POST / PUT / DELETE can be used for methods which execute the standard POST / PUT / DELETE operations against the API (only GET varies due to the conflicting nature of GET as an http operation vs class accessor method)
* SET methods on One-Way Observables should remain private (and set only by the service, via API call)
* If there is a need to update a certain object on the client side (i.e. lending application) this should be stored as a separate observable than the one set as a result of the API call.

## Good Practices for Using Observables in Components
* Components should define 2 separate methods for 
	* 1) loading data from the API (if needed)
	* 2) subscribing to the observable
* Components call the LOAD methods only when there is a need to retrieve the data from the API (if the data has changed or has not been loaded yet)
* Components call the GET method simply to retrieve the data - no need to LOAD every time a component needs a certain entity or group of entities
