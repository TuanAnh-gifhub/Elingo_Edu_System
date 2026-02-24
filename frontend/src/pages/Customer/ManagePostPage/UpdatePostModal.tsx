import React, { useEffect } from "react";
import { Form, Input, Modal, message } from "antd";
import postsService, {
  type PostSummaryResponse,
} from "../../../services/posts/posts";

type Props = {
  open: boolean;
  initial: PostSummaryResponse | null;
  onClose: () => void;
  onUpdated: () => void;
};

const UpdatePostModal: React.FC<Props> = ({
  open,
  initial,
  onClose,
  onUpdated,
}) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = React.useState(false);

  useEffect(() => {
    if (!open || !initial) return;
    // chỉ có summary -> để load detail rồi setForm nếu bạn muốn content đầy đủ
    // tạm thời: gọi detail để lấy content
    (async () => {
      try {
        const res = await postsService.getMyPostDetail(initial.postId);
        form.setFieldsValue({
          title: res.result?.title,
          content: res.result?.content,
        });
      } catch (e) {
        console.error(e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial?.postId]);

  const onSubmit = async () => {
    if (!initial) return;

    try {
      const values = await form.validateFields();
      setSaving(true);

      await postsService.updateMyPost(initial.postId, {
        title: values.title,
        content: values.content,
      });

      message.success("Cập nhật tin đăng thành công");
      onUpdated();
    } catch (e: any) {
      if (e?.errorFields) return;
      console.error(e);
      message.error(e?.response?.data?.message || "Cập nhật thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Chỉnh sửa tin đăng"
      open={open}
      onCancel={onClose}
      onOk={onSubmit}
      okText="Lưu"
      cancelText="Hủy"
      confirmLoading={saving}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="title"
          label="Tiêu đề"
          rules={[
            { required: true, message: "Nhập tiêu đề" },
            { max: 150, message: "Tối đa 150 ký tự" },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="content"
          label="Nội dung"
          rules={[{ required: true, message: "Nhập nội dung" }]}
        >
          <Input.TextArea rows={6} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UpdatePostModal;
