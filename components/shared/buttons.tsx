import { RiLoader4Line, RiPencilFill } from "react-icons/ri";

export function NoOutlineButtonBig({
  name,
  type,
  disabled,
  loading,
  onclick,
  btnColor,
}: {
  name: string;
  type: "submit" | "button";
  disabled?: boolean;
  loading?: boolean;
  onclick?: () => void;
  btnColor?: string;
}) {
  return (
    <button
      type={type}
      className={`mt-5 w-full rounded-lg py-4 flex items-center justify-center text-center`}
      disabled={disabled}
      onClick={onclick}
      style={{ backgroundColor: btnColor || "#263382" }}
    >
      {loading ? <RiLoader4Line className="animate-spin text-2xl" /> : name}
    </button>
  );
}

interface WriteButtonProps {
  onClick: () => void;
}

export function WriteButton({ onClick }: WriteButtonProps) {
  return (
    <button
      className="p-4 bg-[#263382] rounded-full fixed bottom-5 right-5 shadow-lg hover:bg-[#1f2e6a] transition-all"
      onClick={onClick}
    >
      <RiPencilFill className="text-2xl text-white" />
    </button>
  );
}

