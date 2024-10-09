import React from "react";

interface ModalProps {
  isOpen: boolean | null;
  onClose: () => void;
  children?: React.ReactNode;
}

/**
 * A full-screen modal component that displays a children component when isOpen is true.
 * Closes itself when the user clicks outside of the modal.
 *
 * @param {boolean | null} isOpen - Whether the modal is open or not.
 * @param {() => void} onClose - Function to call when the modal is closed.
 * @param {ReactNode} [children] - The children to display inside the modal.
 */
export function FullModal({ isOpen, onClose, children }: ModalProps) {
    if (!isOpen) return null;
  
    return (
      <div
        className="fixed inset-0 z-50 overflow-hidden flex justify-center items-center"
      >
        <div
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-filter backdrop-blur-lg"
          onClick={onClose}
        ></div>
        <div
          className="bg-[#0E1018] text-white relative w-full h-full mx-auto my-8 overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="absolute top-4 right-4"
            onClick={onClose}
          >
            <p className="text-3xl">&times;</p>
          </button>
          <div className="p-8">
            {children}
          </div>
        </div>
      </div>
    );
  };