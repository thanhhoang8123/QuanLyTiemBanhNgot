import { useCallback, useEffect, useMemo, useState } from 'react'
import Button from '../../../components/Button.jsx'
import ConfirmDialog from '../../../components/ConfirmDialog.jsx'
import DataTable from '../../../components/DataTable.jsx'
import ErrorState from '../../../components/ErrorState.jsx'
import FormField from '../../../components/FormField.jsx'
import LoadingState from '../../../components/LoadingState.jsx'
import Modal from '../../../components/Modal.jsx'
import PageHeader from '../../../components/PageHeader.jsx'
import SearchFilter from '../../../components/SearchFilter.jsx'
import {
  createAccount,
  deleteAccount,
  getAccounts,
  getRoles,
  updateAccount,
} from '../services/accountService.js'
import { getUserFacingErrorMessage } from '../../../services/apiClient.js'

const emptyForm = {
  username: '',
  password: '',
  roleId: '',
  status: 'ACTIVE',
}

const inputClass = 'h-10 w-full rounded-xl border border-border bg-white px-3 text-sm text-rosewood outline-none transition focus:border-caramel'
const roleLabels = {
  ADMIN: 'Quản trị viên',
  MANAGER: 'Quản lý',
  STAFF: 'Nhân viên',
  CUSTOMER: 'Khách hàng',
}
const accountStatusLabels = {
  ACTIVE: 'Đang hoạt động',
  LOCKED: 'Đã khóa',
  PENDING_VERIFICATION: 'Chờ xác minh email',
}

function errorMessage(error) {
  return getUserFacingErrorMessage(error)
}

export default function AccountsPage({ onToast }) {
  const [accounts, setAccounts] = useState([])
  const [roles, setRoles] = useState([])
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [accountToDelete, setAccountToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadData = useCallback(async (signal) => {
    setIsLoading(true)
    setLoadError('')
    try {
      const [accountData, roleData] = await Promise.all([
        getAccounts({ signal }),
        getRoles({ signal }),
      ])
      if (!Array.isArray(accountData) || !Array.isArray(roleData)) {
        throw new Error('Chưa thể tải danh sách tài khoản. Vui lòng thử lại.')
      }
      setAccounts(accountData)
      setRoles(roleData)
    } catch (error) {
      if (error.name !== 'AbortError') setLoadError(errorMessage(error))
    } finally {
      if (!signal?.aborted) setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void loadData(controller.signal)
    return () => controller.abort()
  }, [loadData])

  const filteredAccounts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('vi')
    if (!normalizedQuery) return accounts

    return accounts.filter((account) => (
      `${account.username ?? ''} ${account.roleName ?? ''} ${account.roleCode ?? ''} ${account.status ?? ''}`
        .toLocaleLowerCase('vi')
        .includes(normalizedQuery)
    ))
  }, [accounts, query])
  const availableRoles = editingAccount?.roleCode === 'CUSTOMER'
    ? roles.filter((role) => role.roleCode?.toUpperCase() === 'CUSTOMER')
    : roles.filter((role) => role.roleCode?.toUpperCase() !== 'CUSTOMER')

  const openCreate = () => {
    const staffRole = roles.find((role) => role.roleCode?.toUpperCase() === 'STAFF')
    setEditingAccount(null)
    setForm({
      ...emptyForm,
      roleId: staffRole ? String(staffRole.id) : (roles[0] ? String(roles[0].id) : ''),
    })
    setFormError('')
    setFormOpen(true)
  }

  const openEdit = (account) => {
    setEditingAccount(account)
    setForm({
      username: account.username ?? '',
      password: '',
      roleId: account.roleId ? String(account.roleId) : '',
      status: account.status ?? 'ACTIVE',
    })
    setFormError('')
    setFormOpen(true)
  }

  const closeForm = () => {
    if (isSaving) return
    setFormOpen(false)
    setEditingAccount(null)
    setFormError('')
  }

  const saveAccount = async (event) => {
    event.preventDefault()
    if (!form.username.trim() || !form.roleId) {
      setFormError('Vui lòng nhập tên đăng nhập và chọn vai trò.')
      return
    }
    if (!editingAccount && form.password.length < 8) {
      setFormError('Mật khẩu phải có ít nhất 8 ký tự.')
      return
    }
    if (form.password && form.password.length > 72) {
      setFormError('Mật khẩu không được vượt quá 72 ký tự.')
      return
    }

    setIsSaving(true)
    setFormError('')
    try {
      const payload = {
        username: form.username.trim(),
        password: form.password || null,
        roleId: Number(form.roleId),
        status: form.status,
      }
      if (editingAccount) {
        await updateAccount(editingAccount.id, payload)
        onToast('Đã cập nhật tài khoản.')
      } else {
        await createAccount(payload)
        onToast('Đã tạo tài khoản.')
      }
      setFormOpen(false)
      setEditingAccount(null)
      await loadData()
    } catch (error) {
      setFormError(errorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!accountToDelete) return
    setIsDeleting(true)
    try {
      await deleteAccount(accountToDelete.id)
      onToast('Đã xóa tài khoản.')
      setAccountToDelete(null)
      await loadData()
    } catch (error) {
      setLoadError(errorMessage(error))
      setAccountToDelete(null)
    } finally {
      setIsDeleting(false)
    }
  }

  const columns = [
    {
      key: 'username',
      label: 'Tài khoản',
      render: (account) => (
        <div>
          <p className="font-semibold text-rosewood">{account.username}</p>
          <p className="mt-1 text-[10px] text-muted">ID: {account.id}</p>
        </div>
      ),
    },
    {
      key: 'roleName',
      label: 'Vai trò',
      render: (account) => (
        <span>{account.roleName || roleLabels[account.roleCode] || 'Chưa gán'}</span>
      ),
    },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (account) => (
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
          account.status === 'ACTIVE'
            ? 'bg-emerald-50 text-emerald-800'
            : 'bg-amber-50 text-amber-800'
        }`}>
          {accountStatusLabels[account.status] || 'Chưa xác định'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Thao tác',
      render: (account) => (
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => openEdit(account)}>Sửa</Button>
          <Button size="sm" variant="danger" onClick={() => setAccountToDelete(account)}>Xóa</Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý tài khoản"
        description="Tạo tài khoản nhân viên, cập nhật vai trò và khóa tài khoản không còn hoạt động."
        actions={<Button onClick={openCreate}>Tạo tài khoản</Button>}
      />

      <SearchFilter
        value={query}
        onChange={setQuery}
        placeholder="Tìm theo username, vai trò hoặc trạng thái..."
      />

      {loadError && <ErrorState description={loadError} onRetry={() => void loadData()} />}
      {isLoading ? (
        <LoadingState label="Đang tải tài khoản..." />
      ) : !loadError ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-white">
          <DataTable
            columns={columns}
            rows={filteredAccounts}
            rowKey={(account) => account.id}
            ariaLabel="Danh sách tài khoản"
            emptyTitle="Chưa có tài khoản phù hợp"
            emptyDescription="Thử đổi từ khóa tìm kiếm hoặc tạo tài khoản mới."
          />
        </div>
      ) : null}

      <Modal
        open={formOpen}
        title={editingAccount ? 'Cập nhật tài khoản' : 'Tạo tài khoản'}
        onClose={closeForm}
        closeDisabled={isSaving}
      >
        <form className="space-y-4" onSubmit={saveAccount}>
          {formError && (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {formError}
            </div>
          )}
          <FormField id="account-username" label="Tên đăng nhập" required>
            {(fieldProps) => (
              <input
                {...fieldProps}
                className={inputClass}
                autoComplete="username"
                minLength={4}
                maxLength={50}
                pattern="[A-Za-z0-9._-]+"
                required
                value={form.username}
                onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
              />
            )}
          </FormField>
          <FormField
            id="account-password"
            label={editingAccount ? 'Mật khẩu mới' : 'Mật khẩu'}
            required={!editingAccount}
            hint={editingAccount ? 'Để trống nếu không muốn đổi mật khẩu.' : 'Tối thiểu 8 ký tự.'}
          >
            {(fieldProps) => (
              <input
                {...fieldProps}
                className={inputClass}
                type="password"
                autoComplete={editingAccount ? 'new-password' : 'new-password'}
                minLength={editingAccount && !form.password ? undefined : 8}
                maxLength={72}
                required={!editingAccount}
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              />
            )}
          </FormField>
          <FormField id="account-role" label="Vai trò" required>
            {(fieldProps) => (
              <select
                {...fieldProps}
                className={inputClass}
                required
                disabled={editingAccount?.roleCode === 'CUSTOMER'}
                value={form.roleId}
                onChange={(event) => setForm((current) => ({ ...current, roleId: event.target.value }))}
              >
                <option value="">Chọn vai trò</option>
                {availableRoles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name || roleLabels[role.roleCode] || 'Vai trò khác'}
                  </option>
                ))}
              </select>
            )}
          </FormField>
          <FormField id="account-status" label="Trạng thái">
            {(fieldProps) => (
              <select
                {...fieldProps}
                className={inputClass}
                value={form.status}
                onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
              >
                <option value="ACTIVE">Đang hoạt động</option>
                <option value="LOCKED">Đã khóa</option>
                {editingAccount?.status === 'PENDING_VERIFICATION' && (
                  <option value="PENDING_VERIFICATION">Chờ xác minh email</option>
                )}
              </select>
            )}
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" disabled={isSaving} onClick={closeForm}>Hủy</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Đang lưu...' : 'Lưu tài khoản'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(accountToDelete)}
        title="Xóa tài khoản"
        description={accountToDelete
          ? `Bạn có chắc muốn xóa tài khoản "${accountToDelete.username}"? Thao tác có thể bị từ chối nếu tài khoản còn liên kết dữ liệu nghiệp vụ.`
          : ''}
        confirmLabel="Xóa tài khoản"
        onConfirm={confirmDelete}
        onClose={() => setAccountToDelete(null)}
        busy={isDeleting}
      />
    </div>
  )
}
