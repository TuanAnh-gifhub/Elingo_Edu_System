import React from "react";
import { Button } from "antd";
import { FileTextOutlined, PlusOutlined } from "@ant-design/icons";

type Props = {
  onCreate: () => void;
};

const PageHeader: React.FC<Props> = ({ onCreate }) => {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <FileTextOutlined className="text-3xl text-[#4da6ff]" />
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Quản lý tin đăng
            </h1>
            <p className="text-gray-600 mt-1">
              Quản lý các tin đăng phòng của bạn
            </p>
          </div>
        </div>

        <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
          Tạo tin đăng
        </Button>
      </div>
    </div>
  );
};

export default PageHeader;
