import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCheck, faExclamation, faInfo, faWarning } from '@fortawesome/free-solid-svg-icons'

type input = {
  type: "alert-warning" | "alert-error" | "alert-success" | "alert-info"
  message: string;
}

export default function Alert({ type, message }: input) {
  return (
    <div role="alert" className={`alert ${type}`}>
      <FontAwesomeIcon
        icon={
          type.split("-")[1] == "warning" ? faWarning :
          type.split("-")[1] == "error" ? faExclamation :
          type.split("-")[1] == "success" ? faCheck : faInfo
        } size='sm'
      />
      <span>{message}</span>
    </div>
  );
}
