import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'customerRole'
})
export class CustomerRolePipe implements PipeTransform {

  transform(value: string | null | undefined): string {
    if (!value) return '';

    switch (value) {

      case 'CUSTOMER_ADMIN':
        return 'Customer Admin';

      case 'CUSTOMER_TEAM_MEMBER':
        return 'Team Member';

      case 'BRANCH_ADMIN':
        return 'Branch Admin';

      case 'BRANCH_USER':
        return 'Branch User';

      default:
        return value
          .toLowerCase()
          .replace(/_/g, ' ')
          .replace(/\b\w/g, char => char.toUpperCase());
    }
  }
}
