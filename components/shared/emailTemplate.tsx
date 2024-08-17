interface EmailTemplateProps {
    message: string;
}

export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
    message,
  }) => (
    <div dangerouslySetInnerHTML={{ __html: message }} />
);
