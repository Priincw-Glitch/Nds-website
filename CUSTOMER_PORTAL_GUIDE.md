# CUSTOMER PORTAL IMPLEMENTATION GUIDE

**Status: Backend 95% Complete | Frontend 30% Complete**

---

## ✅ YANG SUDAH SELESAI

### Database & Models (30+ files)
- ✅ 9 Migration files - struktur database lengkap
- ✅ 10 Model files - relasi Eloquent sempurna
- ✅ Soft delete, timestamps, casts sudah configured

### Backend Controllers (9 files)
- ✅ **CustomerAuthController** - Login, Register, Logout
- ✅ **CustomerDashboardController** - Dashboard overview
- ✅ **CustomerServiceController** - View services
- ✅ **CustomerProfileController** - Profile management
- ✅ **SupportTicketController** (Customer) - Create & reply tickets
- ✅ **CustomerNotificationController** - Notifications
- ✅ **CustomerManagementController** (Admin) - Customer CRUD, registrations approval
- ✅ **CustomerServiceManagementController** (Admin) - Service assignment
- ✅ **SupportTicketManagementController** (Admin) - Support management

### Security & Routes
- ✅ EnsureCustomerIsActive middleware
- ✅ EnsureUserIsAdmin middleware
- ✅ 30+ routes dengan proper grouping
- ✅ Authorization checks di semua endpoint

### Frontend Pages (2 files)
- ✅ Customer/Login.tsx - Professional login page
- ✅ Customer/Register.tsx - Multi-step registration

### Database Seeder
- ✅ AdminUserSeeder - Create admin user (admin@nds.com / password)

---

## 🚀 QUICK START

### 1. Run Migrations
```bash
php artisan migrate
php artisan db:seed --class=AdminUserSeeder
```

### 2. Login ke Admin Panel
```
URL: http://localhost/admin/login
Email: admin@nds.com
Password: password (ubah setelah login pertama)
```

### 3. Customer Registration Flow
1. Customer: `/customer/register` → isi form
2. Admin: `/admin/customers/registrations` → approve/reject
3. Customer: `/customer/login` → login dengan akun yang sudah disetujui
4. System: Auto create user account & send temp password

---

## 📋 FRONTEND PAGES YANG PERLU DIBUAT

### Tingkat Prioritas 1 (Critical)

**Customer Pages:**

1. **Customer/RegisterSuccess.tsx**
   - Halaman setelah registrasi berhasil
   - Tampilkan pesan sukses
   - Link ke login page

2. **Customer/Dashboard.tsx**
   - Overview: active services, open tickets, recent notifications
   - Stats cards
   - Quick actions
   - Recent activities

3. **Customer/Support/Create.tsx**
   - Form untuk buat ticket baru
   - Select service related
   - Upload attachments
   - Category selection

### Tingkat Prioritas 2 (Important)

4. **Customer/Support/Index.tsx**
   - List semua tickets
   - Filter & search
   - Pagination
   - Status badges

5. **Customer/Support/Show.tsx**
   - Ticket detail + messages
   - Reply form
   - File attachments
   - Status updates

6. **Customer/Services/Index.tsx**
   - List customer services
   - Status display
   - Quick links ke support

**Admin Pages:**

7. **Admin/Customers/Index.tsx**
   - Customer list dengan search/filter
   - Status column
   - Actions (view, edit, delete)

8. **Admin/Customers/Show.tsx**
   - Customer detail
   - Subscribed services
   - Support tickets
   - Activity log

9. **Admin/Support/Index.tsx**
   - Support tickets list
   - Status, priority, assigned
   - Search & filters

### Tingkat Prioritas 3 (Enhancement)

10. **Customer/Profile.tsx** - Edit profile, change password
11. **Customer/Services/Show.tsx** - Service detail
12. **Customer/Notifications.tsx** - Notification list
13. **Admin/Customers/Registrations.tsx** - Approve/reject registrations
14. **Admin/CustomerServices/Index.tsx** - Manage customer services
15. **Admin/CustomerServices/Create.tsx** - Assign service
16. **Admin/Support/Show.tsx** - Support detail & reply

---

## 🏗️ LAYOUT COMPONENTS

### CustomerLayout.tsx
Gunakan sidebar layout dengan menu:
- Dashboard
- Services
- Support Tickets
- Profile
- Notifications
- Logout

### AdminCustomerLayout.tsx
Extend dari existing admin layout, tambah:
- Customer Management
- Service Management
- Support Management

---

## 🔄 WORKFLOW IMPLEMENTATION

### Customer Registration Flow
```
Customer Fill Form
        ↓
POST /customer/register
        ↓
CustomerRegistration.create (status: pending)
        ↓
Admin See in /admin/customers/registrations
        ↓
Admin Click Approve
        ↓
User.create + CustomerProfile.create
        ↓
Notification to customer
        ↓
Customer Login dengan akun baru
```

### Support Ticket Flow
```
Customer Create Ticket (/customer/support/create)
        ↓
SupportTicket.create + TicketMessage.create
        ↓
Notification to all admins
        ↓
Admin Assign Ticket (/admin/support)
        ↓
Admin Reply to Ticket
        ↓
Notification to customer
        ↓
Customer Reply
        ↓
Mark as Resolved/Closed
```

### Service Assignment Flow
```
Admin Add Service (/admin/customer-services/create)
        ↓
CustomerService.create
        ↓
Notification to customer: "Service Activated"
        ↓
Customer See in Services Page
        ↓
Customer Can Create Ticket Related to Service
```

---

## 🔐 AUTHORIZATION RULES

### Customer Can:
- ✅ View own profile
- ✅ Edit own profile
- ✅ View own services
- ✅ View own tickets
- ✅ Create tickets
- ✅ Reply to own tickets
- ❌ View other customers' data
- ❌ Modify service status
- ❌ Approve registrations

### Admin Can:
- ✅ View all customers
- ✅ Manage registrations
- ✅ Assign services
- ✅ Modify service status
- ✅ View all tickets
- ✅ Reply to tickets
- ✅ Change ticket status
- ✅ Create internal notes

---

## 📊 DATABASE RELATIONSHIPS

```
User (admin/customer)
  ├── CustomerProfile (1:1)
  ├── CustomerService* (1:many)
  │   └── SupportTicket* (1:many)
  │       ├── TicketMessage* (1:many)
  │       │   └── TicketAttachment* (1:many)
  │       └── assignedTo → User (admin)
  ├── SupportTicket* (1:many) - as creator
  ├── TicketMessage* (1:many)
  ├── Notification* (1:many)
  ├── ActivityLog* (1:many)
  └── CustomerRegistration* (1:many) - as approver

Service (1:many)
  ├── CustomerService*
  └── CustomerRegistration*

CustomerRegistration
  └── approver → User (admin)
  └── service → Service
```

---

## 🎯 TESTING CHECKLIST

### Basic Flow:
- [ ] Admin login & change password
- [ ] Customer register
- [ ] Admin approve registration
- [ ] Customer login
- [ ] Customer view dashboard
- [ ] Customer view services
- [ ] Admin assign new service to customer
- [ ] Customer see new service
- [ ] Customer create support ticket
- [ ] Admin see ticket
- [ ] Admin reply to ticket
- [ ] Customer see reply
- [ ] Customer reply to admin
- [ ] Admin close ticket

### Authorization Tests:
- [ ] Customer can't access admin pages
- [ ] Admin can't access customer portal (hanya view data)
- [ ] Customer can't see other customer's data
- [ ] Customer can't modify service status

### Edge Cases:
- [ ] Suspended customer can't login
- [ ] Unverified email registration
- [ ] File upload validation
- [ ] Rate limiting on login

---

## 📝 DEPLOYMENT CHECKLIST

Before Production:

1. **Database:**
   - [ ] Run migrations
   - [ ] Run seeders
   - [ ] Backup existing data

2. **Environment:**
   - [ ] Update .env with correct DB settings
   - [ ] Set APP_ENV=production
   - [ ] Configure email (for notifications)

3. **Files:**
   - [ ] Create storage/app/ticket-attachments directory
   - [ ] Set proper permissions
   - [ ] Configure file storage

4. **Security:**
   - [ ] Change admin default password
   - [ ] Enable HTTPS
   - [ ] Set CSRF tokens
   - [ ] Configure rate limiting

5. **Testing:**
   - [ ] Test complete registration flow
   - [ ] Test ticket creation
   - [ ] Test admin management
   - [ ] Test authorization

---

## 🚨 COMMON ISSUES & SOLUTIONS

### Issue: 403 Unauthorized
**Solution:** Check middleware in bootstrap/app.php - pastikan middleware alias sudah terdaftar

### Issue: Customer can't access portal after approval
**Solution:** Check user status - harus 'active', dan role harus 'customer'

### Issue: Attachments tidak tersimpan
**Solution:** Buat directory: `storage/app/ticket-attachments` dan set permissions 755

### Issue: Notification tidak muncul
**Solution:** Buat Notification model sudah ada, notifications table sudah exist

---

## 📚 API ENDPOINTS REFERENCE

### Customer Routes
```
GET    /customer/login                      - Show login form
POST   /customer/login                      - Process login
GET    /customer/register                   - Show register form
POST   /customer/register                   - Process registration
GET    /customer/register/success           - Registration success page
POST   /customer/logout                     - Logout

GET    /customer/dashboard                  - Dashboard
GET    /customer/services                   - List services
GET    /customer/services/{id}              - Service detail

GET    /customer/profile                    - Profile page
PUT    /customer/profile                    - Update profile
POST   /customer/profile/avatar             - Update avatar
PUT    /customer/profile/password           - Change password

GET    /customer/support                    - Support tickets list
GET    /customer/support/create             - Create ticket form
POST   /customer/support                    - Store ticket
GET    /customer/support/{ticket}           - Ticket detail
POST   /customer/support/{ticket}/reply     - Reply to ticket
PATCH  /customer/support/{ticket}/close     - Close ticket

GET    /customer/notifications              - Notifications
PATCH  /customer/notifications/{id}/read    - Mark read
POST   /customer/notifications/read-all     - Mark all read
GET    /customer/notifications/unread-count - Get count
```

### Admin Routes
```
GET    /admin/customers                          - Customer list
POST   /admin/customers                          - Create customer
GET    /admin/customers/{customer}               - Customer detail
PUT    /admin/customers/{customer}               - Update customer
DELETE /admin/customers/{customer}               - Delete customer
GET    /admin/customers/registrations/list       - Registrations
POST   /admin/customers/{registration}/approve  - Approve
POST   /admin/customers/{registration}/reject   - Reject

GET    /admin/customer-services                  - Services list
GET    /admin/customer-services/create           - Create form
POST   /admin/customer-services                  - Store
GET    /admin/customer-services/{id}/edit        - Edit form
PUT    /admin/customer-services/{id}             - Update
DELETE /admin/customer-services/{id}             - Delete
POST   /admin/customer-services/bulk-update-status

GET    /admin/support                            - Tickets list
GET    /admin/support/{ticket}                   - Ticket detail
POST   /admin/support/{ticket}/reply             - Reply
PATCH  /admin/support/{ticket}/status            - Update status
PATCH  /admin/support/{ticket}/priority          - Update priority
PATCH  /admin/support/{ticket}/assign            - Assign
GET    /admin/support/statistics                 - Stats
```

---

## 🎨 UI COMPONENTS SUDAH TERSEDIA

Gunakan dari existing project:
- Button component
- Input fields
- Select dropdown
- Textarea
- Card component
- Badge component
- Pagination
- Icons dari Lucide

---

## 📞 NEXT STEPS

1. **Immediate:**
   - Run migrations & seeder
   - Test login flow dengan admin
   - Test registration flow

2. **Short Term (Priority 1):**
   - Buat 3 halaman paling penting:
     - Customer/Dashboard.tsx
     - Customer/Support/Create.tsx
     - Admin/Support/Index.tsx

3. **Medium Term (Priority 2):**
   - Lengkapi remaining customer pages
   - Lengkapi remaining admin pages

4. **Long Term:**
   - Add real-time notifications (Reverb/Pusher)
   - Add email notifications
   - Add advanced reporting

---

## 📞 SUPPORT

Jika ada error atau pertanyaan:
1. Cek console browser untuk error
2. Cek `storage/logs/laravel.log` untuk server errors
3. Pastikan migrations sudah berjalan: `php artisan migrate:status`
4. Pastikan middleware terdaftar di `bootstrap/app.php`

**Status: READY FOR FRONTEND IMPLEMENTATION** ✅
