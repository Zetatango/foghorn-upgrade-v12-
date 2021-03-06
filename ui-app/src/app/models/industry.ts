/** Note: It is important that the keys match the values. */
export enum Industry {
  APPAREL_AND_ACCESSORIES = 'APPAREL_AND_ACCESSORIES',
  ANTIQUE_SHOPS = 'ANTIQUE_SHOPS',
  ART_GALLERY = 'ART_GALLERY',
  AUTOMOBILE_DEALERSHIPS = 'AUTOMOBILE_DEALERSHIPS',
  AUTOMOBILE_PARTS_AND_ACCESSORIES = 'AUTOMOBILE_PARTS_AND_ACCESSORIES',
  AUTOMOBILE_RELATED = 'AUTOMOBILE_RELATED',
  AUTOMOBILE_RENTALS_AND_LEASING = 'AUTOMOBILE_RENTALS_AND_LEASING',
  AUTOMOBILE_REPAIR_SHOP = 'AUTOMOBILE_REPAIR_SHOP',
  AUTOMOBILE_TIRE_SHOP = 'AUTOMOBILE_TIRE_SHOP',
  BAKERIES = 'BAKERIES',
  BAR = 'BAR',
  BEAUTY_HAIR_SALON_RETAIL = 'BEAUTY_HAIR_SALON_RETAIL',
  BEAUTY_HAIR_SALON_RETAIL_AND_WHOLESALE = 'BEAUTY_HAIR_SALON_RETAIL_AND_WHOLESALE',
  BEAUTY_HAIR_SALON_WHOLESALE = 'BEAUTY_HAIR_SALON_WHOLESALE',
  BICYCLE_SHOPS_SALES_AND_SERVICE = 'BICYCLE_SHOPS_SALES_AND_SERVICE',
  BILLIARDS_AND_POOL_HALLS = 'BILLIARDS_AND_POOL_HALLS',
  BOOK_STORES = 'BOOK_STORES',
  BUTCHER = 'BUTCHER',
  CANDY_CHOCOLATE = 'CANDY_CHOCOLATE',
  CARPET_FLOORING = 'CARPET_FLOORING',
  CAR_WASHES = 'CAR_WASHES',
  CATERER = 'CATERER',
  CEMETERY_BURIAL_HOME = 'CEMETERY_BURIAL_HOME',
  CHILDRENS_CLOTHING = 'CHILDRENS_CLOTHING',
  CLEANING_PRODUCTS = 'CLEANING_PRODUCTS',
  CLOTHING = 'CLOTHING',
  COFFEE_SHOP = 'COFFEE_SHOP',
  COMPUTER_ELECTRONICS_REPAIR = 'COMPUTER_ELECTRONICS_REPAIR',
  COMPUTER_ELECTRONICS_RETAIL = 'COMPUTER_ELECTRONICS_RETAIL',
  CONSTRUCTION_RELATED = 'CONSTRUCTION_RELATED',
  CONVENIENCE_STORE = 'CONVENIENCE_STORE',
  COSMETICS_RETAIL = 'COSMETICS_RETAIL',
  CRAFT_SHOP = 'CRAFT_SHOP',
  DANCE_STUDIO = 'DANCE_STUDIO',
  DENTIST = 'DENTIST',
  DOCTOR = 'DOCTOR',
  DOLLAR_STORE = 'DOLLAR_STORE',
  DRUG_STORE = 'DRUG_STORE',
  DRY_CLEANERS = 'DRY_CLEANERS',
  ELECTRICAL_AND_SMALL_APPLIANCE_REPAIR = 'ELECTRICAL_AND_SMALL_APPLIANCE_REPAIR',
  EQUIPMENT_RENTAL_AND_LEASING_SERVICES = 'EQUIPMENT_RENTAL_AND_LEASING_SERVICES',
  FAST_FOOD_RESTAURANT = 'FAST_FOOD_RESTAURANT',
  FLORIST = 'FLORIST',
  FOOD_STORE = 'FOOD_STORE',
  FURNITURE = 'FURNITURE',
  GARDENING = 'GARDENING',
  GAS_STATIONS = 'GAS_STATIONS',
  GENERAL_RETAIL = 'GENERAL_RETAIL',
  GIFT_CARD = 'GIFT_CARD',
  GIFT_CARD_NOVELTY_AND_STATIONERY = 'GIFT_CARD_NOVELTY_AND_STATIONERY',
  GOLF_COURSE = 'GOLF_COURSE',
  GYM = 'GYM',
  HARDWARE = 'HARDWARE',
  HEALTH_SERVICES = 'HEALTH_SERVICES',
  HOME_AND_GARDEN = 'HOME_AND_GARDEN',
  HOBBY_TOY_GAME = 'HOBBY_TOY_GAME',
  HOME_FURNISHINGS = 'HOME_FURNISHINGS',
  HOUSEHOLD_APPLIANCE_REPAIR = 'HOUSEHOLD_APPLIANCE_REPAIR',
  HOUSEHOLD_APPLIANCE_RETAIL = 'HOUSEHOLD_APPLIANCE_RETAIL',
  JEWELLERY = 'JEWELLERY',
  LIGHTING = 'LIGHTING',
  LIQUOR_STORE = 'LIQUOR_STORE',
  LODGING = 'LODGING',
  MACHINERY = 'MACHINERY',
  MANUFACTURING = 'MANUFACTURING',
  MEMBERSHIP_CLUBS = 'MEMBERSHIP_CLUBS',
  MISC_BLUE_COLLAR_SERVICES = 'MISC_BLUE_COLLAR_SERVICES',
  MISC_WHITE_COLLAR_SERVICES = 'MISC_WHITE_COLLAR_SERVICES',
  MUSIC_STORES = 'MUSIC_STORES',
  NOVELTY_AND_STATIONERY = 'NOVELTY_AND_STATIONERY',
  OPTICIANS = 'OPTICIANS',
  OTHER = 'OTHER',
  OTHER_CONTRACTING_SERVICES = 'OTHER_CONTRACTING_SERVICES',
  OTHER_OFFICE_BASED_SERVICES = 'OTHER_OFFICE_BASED_SERVICES',
  OTHER_TRANSPORTATION = 'OTHER_TRANSPORTATION',
  PARTY_STORE = 'PARTY_STORE',
  PAWN_SHOP = 'PAWN_SHOP',
  PET_RELATED = 'PET_RELATED',
  PHOTO_STUDIO = 'PHOTO_STUDIO',
  PLUMBER = 'PLUMBER',
  POOLS_HOT_TUBS = 'POOLS_HOT_TUBS',
  PRINT_SHOP = 'PRINT_SHOP',
  REAL_ESTATE = 'REAL_ESTATE',
  RECREATION_SERVICES = 'RECREATION_SERVICES',
  RESTAURANT = 'RESTAURANT',
  SHOE_REPAIR = 'SHOE_REPAIR',
  SHOE_STORE_RETAIL = 'SHOE_STORE_RETAIL',
  SNOW_REMOVAL = 'SNOW_REMOVAL',
  SPA = 'SPA',
  SPORTING_GOODS = 'SPORTING_GOODS',
  TAILOR_SEAMSTRESS = 'TAILOR_SEAMSTRESS',
  TANNING_SALON = 'TANNING_SALON',
  TATTOO_PARLOUR = 'TATTOO_PARLOUR',
  TAXI_LIMOUSINE = 'TAXI_LIMOUSINE',
  TAX_PREPARATION_SERVICES = 'TAX_PREPARATION_SERVICES',
  TOURIST = 'TOURIST',
  TOWING_SERVICES = 'TOWING_SERVICES',
  TRANSPORTATION = 'TRANSPORTATION',
  TRAVEL = 'TRAVEL',
  TRUCKING = 'TRUCKING'
}


export function isIndustry(value: string): boolean {
  return Object.values(Industry).includes(value as Industry);
}

export function asIndustry(value: string): Industry {
  return (isIndustry(value)) ? value as Industry : null;
}
