export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'STAFF' | 'EDITOR' | 'DRIVER' | 'CLIENT' | 'VIEWER';

export const ROLE_HIERARCHY: Record<Role, number> = {
  SUPER_ADMIN: 100,
  ADMIN: 80,
  MANAGER: 60,
  STAFF: 40,
  EDITOR: 40, // Legacy support
  DRIVER: 20,
  CLIENT: 10,
  VIEWER: 10
};

export type Permission = 
  | 'manage_users'
  | 'manage_config'
  | 'manage_products'
  | 'manage_categories'
  | 'manage_points_of_sale'
  | 'manage_promos'
  | 'manage_page_content'
  | 'manage_drivers'
  | 'manage_callbacks'
  | 'manage_system'
  | 'view_dashboard'
  | 'view_orders'
  | 'edit_orders'
  | 'delete_orders'
  | 'advance_order_status'
  | 'driver_actions';

export function hasPermission(userRole: string | null | undefined, permission: Permission): boolean {
  if (!userRole) return false;
  
  // Normalize string to Role type matching UPPERCASE format
  const normalizedRole = userRole.toUpperCase() as Role;
  
  // SUPER_ADMIN Bypass Absolute Rule
  if (normalizedRole === 'SUPER_ADMIN') return true;

  // For compatibility with previous lower-case roles during transition
  if (userRole === 'super_admin') return true;

  const roleValue = ROLE_HIERARCHY[normalizedRole] || 0;

  switch (permission) {
    case 'manage_users':
    case 'manage_system':
      return roleValue >= ROLE_HIERARCHY.SUPER_ADMIN;
      
    case 'manage_config':
    case 'delete_orders':
    case 'manage_points_of_sale':
    case 'manage_promos':
    case 'manage_page_content':
      return roleValue >= ROLE_HIERARCHY.ADMIN;
      
    case 'manage_products':
    case 'manage_categories':
    case 'manage_callbacks':
    case 'manage_drivers':
      return roleValue >= ROLE_HIERARCHY.ADMIN; // Keeping admin here to be safe

    case 'advance_order_status':
      return roleValue >= ROLE_HIERARCHY.MANAGER;

    case 'edit_orders':
    case 'view_dashboard':
    case 'view_orders':
      return roleValue >= ROLE_HIERARCHY.STAFF;
      
    case 'driver_actions':
      return roleValue >= ROLE_HIERARCHY.DRIVER;

    default:
      return false;
  }
}
