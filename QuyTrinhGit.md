📌 QUY TRÌNH GIT CỦA NHÓM

1. Không code trực tiếp trên `main`.
2. Mỗi người làm việc trên nhánh riêng:

   * ThanhHoang
   * ThaoNhu
   * ThuyAn

Lần đầu clone project:

```bash
git clone <link-github>
cd QuanLyTiemBanhNgot
git fetch origin
git switch TEN_NHANH
```

Ví dụ:

```bash
git switch ThaoNhu
```

🔹 Mỗi lần bắt đầu làm:

```bash
git switch main
git pull origin main
git switch TEN_NHANH
git merge main
```

Sau đó mới bắt đầu code.

🔹 Khi làm xong:

```bash
git status
git add .
git commit -m "Mo ta cong viec"
git push
```

🔹 Khi muốn đưa code vào `main`:

Không tự merge vào `main`.

Báo nhóm trưởng để kiểm tra code và merge.

Nhóm trưởng sẽ:

```bash
git switch main
git pull origin main
git merge TEN_NHANH
git push origin main
```

⚠️ Lưu ý:

* Không code trực tiếp trên main.
* Commit nên ghi rõ mình đã làm gì.
* Trước khi sửa những file quan trọng nên báo nhóm.
* Nếu phát hiện conflict thì không tự ý xóa code của người khác, báo nhóm trưởng xử lý.
* Sau khi merge vào main, các thành viên cần `git pull origin main` trước khi tiếp tục công việc.
