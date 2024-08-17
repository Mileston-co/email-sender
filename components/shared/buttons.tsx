import { RiLoader4Line } from "react-icons/ri";

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