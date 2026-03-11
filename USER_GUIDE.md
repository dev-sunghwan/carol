# Carol — User Guide

Carol is the internal lunch ordering system for Hanwha Vision Europe EHQ.

---

## For Staff (Users)

### Getting Started

1. You will receive an invitation email or be told to visit the Carol URL.
2. Go to the login page and sign up with your **@hanwha.com** email address.
3. Your account starts as **pending** — an admin must approve it before you can order.
4. Once approved, you will see the weekly menu on the home page.

---

### Placing an Order

1. From the home page, find the current week's menu.
2. Each day shows the full menu — **Main** dish at the top, followed by **Side 1, Side 2**, etc.
3. Click **Order** on any item for the day you want to order lunch.
   - You can only have **one active order per day**.
   - Ordering any item on a given day represents your lunch order for that day (the full set is served).
4. A confirmation appears and your order is saved.

> **Order cutoff times (London time)**
> - Monday lunch: same Monday by **09:15**
> - Tuesday–Friday lunch: previous day by **16:00**

---

### Cancelling an Order

1. Go to **My Orders** in the navigation menu.
2. Find the order you want to cancel.
3. Click **Cancel Order** — this is only available before the cutoff time.

---

### Requesting an Exception

If you missed the cutoff (e.g. you were away or had an emergency):

1. Go to **My Orders**.
2. Click **Request Exception**.
3. Select the type (late order, cancellation, or change) and write a brief reason.
4. An admin will review your request and respond.

---

### Viewing Your Order History

- Go to **My Orders** to see all past and upcoming orders with their status.

| Status | Meaning |
|---|---|
| Placed | Order received, awaiting pickup |
| Picked up | You collected your lunch |
| No-show | Cutoff passed but lunch was not collected |
| Cancelled | Order was cancelled |

---

## For Administrators

### Admin Panel

Access the admin panel via the **Admin** link in the top navigation bar (visible only to admin accounts).

---

### Managing Users

**Path:** Admin → Users

- **Allowed to Order** toggle: Grant or revoke a user's ability to place orders. New signups start as blocked.
- **Role**: Promote a user to Admin or demote to User.
- **Edit** button: Update a user's display name and phone number inline.

> You cannot demote yourself from Admin.

---

### Managing the Weekly Menu

**Path:** Admin → Menu

#### Import from PPTX (Recommended)

1. Click **Import PPTX**.
2. Select the weekly menu PowerPoint file received from the restaurant.
3. Set the **Week Start** date (must be a Monday, e.g. `2026-03-09`).
4. Click **Preview Parsed Menu** to verify the parsed content.
5. Click **Import** to save. You will be taken to the edit page automatically.

> Expected PPTX format: one slide with a table where the first row is Monday–Friday column headers.

#### Manual Entry

1. Click **+ New Week** and set the week start date.
2. For each day, click **+ Add Item** to enter dish name, description, and category.
3. Items are ordered by **display_order**: 0 = Main, 1 = Side 1, 2 = Side 2, etc.

#### Publishing

- Menus are saved as **Draft** by default — staff cannot see them yet.
- Once the menu is ready, open the week and click **Publish**.
- You can unpublish a week to hide it if needed.

---

### Daily Submissions

**Path:** Admin → Submissions

- View which days have had their orders submitted to the restaurant.
- Mark a day as **Submitted** once you have forwarded the order list.
- See a per-day count of active orders.

---

### Reviewing Exception Requests

**Path:** Admin → Exceptions

- View all pending exception requests from staff.
- Click a request to **Approve** or **Reject** with an optional note.
- Approved late orders are created automatically.

---

### Pickup Tracking

**Path:** Admin → Daily View (select a date)

- See all orders placed for a given day.
- Mark each order as **Picked Up** when the staff member collects their lunch.
- Mark as **No-Show** if the lunch was not collected by end of day.

---

### Tips

- **Order counts**: The submissions page shows the total number of orders per day at a glance — use this when contacting the restaurant.
- **Audit trail**: All significant actions (orders, cancellations, approvals, user changes) are logged automatically.
- **Cutoff is automatic**: Staff cannot place or cancel orders after the cutoff — no manual enforcement needed.
