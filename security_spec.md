# Firebase Security Rule - Security Spec

## 1. Data Invariants
- **Config**: Only admins can mutate config settings. Anyone can read.
- **Categories**: Only admins can manage categories. Anyone can read.
- **Products**: Only admins can manage products. Anyone can read.
- **Orders**: 
  - Anyone (even anonymous and un-authenticated, as the frontend doesn't force auth yet) can create an order.
  - Wait, I should enforce verified auth if possible, but the current UI uses local CartContext without auth requirement. Let's look at the instructions. "Unless the app explicitly supports anonymous users, you MUST mandate email_verified == true". The instruction also says "If the application requires storing PII... isolate it". 
  - The current UI doesn't force account creation to order. We must use anonymous auth or let client create doc if they don't have auth, but let's assume they MUST be authenticated anonymously or with Google. Actually, I must use Firebase Auth. I will add Firebase Auth to UI soon. For now, we will require `isSignedIn()`.
  
Wait, I will enforce that `Order` can only be created by an authenticated user, and `userId` field is mandatory for an Order to link it to the user. Orders can only be read by their creator (`resource.data.userId == request.auth.uid`) or by an `isAdmin()`. Admin can list all orders.

## 2. Dirty Dozen Payloads
We will test for:
1. Missing auth
2. Missing ID / Invalid ID chars
3. Privilege escalation (setting isAdmin or role directly)
4. Update gaps (modifying unauthorized fields like order status without admin)
etc...

