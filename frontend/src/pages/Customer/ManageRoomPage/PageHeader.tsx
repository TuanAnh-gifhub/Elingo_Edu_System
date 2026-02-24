import React from "react";
import { HomeOutlined, PlusOutlined } from "@ant-design/icons";
import { Button } from "antd";

type Props = {
  onCreate: () => void;
};

const PageHeader: React.FC<Props> = ({ onCreate }) => {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <HomeOutlined className="text-3xl text-[#4da6ff]" />
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Quản lý tòa nhà
            </h1>
            <p className="text-gray-600 mt-1">
              Thiết lập tòa nhà trước khi thêm phòng học
            </p>
          </div>
        </div>

        <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
          Thêm tòa nhà
        </Button>
      </div>
    </div>
  );
};

export default PageHeader;
