import { Directive, HostListener } from '@angular/core';
import { NavToggleService } from 'app/services/nav-toggle.service';

@Directive({
  selector: '.nav-link:not(.dropdown-toggle), .dropdown-item'
})
export class NavToggleDirective {
  constructor(private navToggleService: NavToggleService) {}
  @HostListener('click') onClick(): void {
    this.navToggleService.isCollapsed = true;
  }
}
