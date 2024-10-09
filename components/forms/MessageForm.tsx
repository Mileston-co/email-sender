"use client";

import { useState } from "react";
import "react-quill/dist/quill.snow.css";
import { NoOutlineButtonBig } from "../shared/buttons";
import { useSession } from "../shared/session";
import sendEmail from "@/server/actions/email.action";
import { StatusMessage } from "../shared/shared";
import dynamic from 'next/dynamic';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

type FormData = {
  email: string;
  name: string;
  message: string;
  to: string;
  subject: string;
};

export default function MessageForm() {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    name: "",
    message: "",
    to: "",
    subject: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const session = useSession();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleQuillChange = (value: string) => {
    setFormData({ ...formData, message: value });
  };

  const validate = () => {
    let tempErrors: { [key: string]: string } = {};

    // Validation for message field
    if (!formData.subject.trim()) {
      tempErrors.subject = "Subject is required.";
    }
    if (!formData.to.trim()) {
      tempErrors.to = "To email is required.";
    }
    if (!formData.message) {
      tempErrors.message = "Message is required.";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (validate()) {
      // Handle form submission
      console.log(formData);
      setSubmitted(false);
      setError(false);
      setLoading(true);

      try {
        const response = await sendEmail(formData);
        if (response != undefined) {
          if (response.message) {
            setSubmitted(true);
            setMessage(response.message);
            // Reset form data
            setFormData({ email: "", name: "", message: "", to: "", subject: "", });
            setLoading(false);
          } else if (response.error) {
            setError(true);
            setMessage(response.error);
            setLoading(false);
          }
        } else {
          setError(true);
          setMessage("An unknown error occured!");
          setLoading(false);
        }
      } catch (error: any) {
        console.error("An unknown error occured", error.message);
        setError(true);
        setMessage("An unknown error occured!");
        setLoading(false);
      }

    } else {
      console.log("Form contains errors");
      setSubmitted(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-4">
        <div className="mb-4">
          <label className="block text-sm font-medium">Email Address</label>
          <p className="text-xs italic">Leave blank if you want to use {session?.email}</p>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`mt-1 block w-full px-3 py-2 bg-[#131621] border ${errors.firstName ? "border-red-500" : "border-[#979EB8]"} rounded-xl focus:outline-none focus:ring-[#979EB8] focus:border-[#979EB8]`}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium">Name</label>
          <p className="text-xs italic">Leave blank if you want to use {session?.firstName} {session?.lastName}</p>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`mt-1 block w-full px-3 py-2 bg-[#131621] border ${errors.firstName ? "border-red-500" : "border-[#979EB8]"} rounded-xl focus:outline-none focus:ring-[#979EB8] focus:border-[#979EB8]`}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium">Subject</label>
          <input
            type="text"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            className={`mt-1 block w-full px-3 py-2 bg-[#131621] border ${errors.subject ? "border-red-500" : "border-[#979EB8]"} rounded-xl focus:outline-none focus:ring-[#979EB8] focus:border-[#979EB8]`}
          />
          {errors.subject && <p className="text-red-500 text-xs mt-2">{errors.subject}</p>}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium">To</label>
          <input
            type="email"
            name="to"
            value={formData.to}
            onChange={handleChange}
            className={`mt-1 block w-full px-3 py-2 bg-[#131621] border ${errors.to ? "border-red-500" : "border-[#979EB8]"} rounded-xl focus:outline-none focus:ring-[#979EB8] focus:border-[#979EB8]`}
          />
          {errors.to && <p className="text-red-500 text-xs mt-2">{errors.to}</p>}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium">Message</label>
          <ReactQuill
            value={formData.message}
            onChange={handleQuillChange}
            className={`custom-quill-editor ql-container mt-1 block w-full bg-[#131621] border ${errors.message ? "border-red-500" : ""} rounded-xl`}
            theme="snow"
          />
          {errors.message && <p className="text-red-500 text-xs mt-2">{errors.message}</p>}
        </div>

        <NoOutlineButtonBig name="Send Email" type="submit" loading={loading} disabled={loading} />
      </form>
      {submitted === true && (
        <StatusMessage type="success" message={message} />
      )}
      {error === true && (
        <StatusMessage type="error" message={message} />
      )}
    </>
  );
}
