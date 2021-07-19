export interface FabMenuItem {
  titleKey: string;           // Localisation key
  icon: string;               // Font awesome icon
  onClick: () => void;        // Function that will run when menu item is clicked
  isVisible: () => boolean;   // Boolean that determines whether menu item is visible
}
