import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NavToggleService {
  isCollapsed = true;

  toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
  }
}
