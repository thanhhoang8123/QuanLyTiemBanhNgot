# Customers

Frontend customer management currently lists customers, filters the loaded list
by name/phone/email, reads a customer detail, creates and updates profile
information, and deletes a customer after confirmation.

- Page: `features/customers/pages/CustomersPage.jsx`
- API service: `features/customers/services/customerService.js`
- Shared HTTP client: `src/services/apiClient.js`
- Route: `/admin/customers`, registered in `src/App.jsx` under `AppLayout`

The backend customer request accepts `fullName`, `phone`, `email`, and `address`.
The page does not send `id`, `loyaltyPoints`, or `status`; those are displayed
from the response because the customer request does not provide a way to update
them. Backend search currently covers name and phone, so the page uses the list
endpoint and filters the returned records locally to include email.

Coordinate with Orders and POS when integrating customer selection into order
creation. Confirm backend behavior before adding filters, status changes, point
adjustments, or other request fields. Do not access the database directly from
the frontend or store secrets in source code.
