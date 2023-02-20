import {
  TJsonValue, LogLevel, IJLogEntry, AbstractLoggable,
  Label, buildOutputDataForDestination, AbstractLogDestination,
  useDestination
} from 'jlog-facade';

export type TGLOGGER_SEVERITY = 'EMERGENCY' | 'ERROR' | 'WARNING' | 'INFO' | 'DEBUG';

type TLabelKV = {[key: string]: string};

const GCLOUD_LABEL_KEY = 'logging.googleapis.com/labels';
const GCLOUD_LOGGER_NAME_KEY = 'loggerName';

/**
 * Define the json output to be consumed by Google Cloud Logging.  The `log` property
 * is used to host the `message` when `.error` is present in the IJLogEntry.  In this
 * case, the `message` should contain stack trace
 * 
 * ref: https://cloud.google.com/logging/docs/agent/logging/configuration#special-fields
 */
export interface IGCloudLogOutput {
  severity: string,
  message: string,
  log?: string,
  time: string,
  [key: string]: TJsonValue
}

/**
 * Convert log level to Severity supported by Google Cloud
 * 
 * Any added level converted to INFO.
 * 
 * @param level 
 */
export function levelToSeverity(level: LogLevel): TGLOGGER_SEVERITY {
  switch (level) {
    case LogLevel.PANIC: // PANIC
      return 'EMERGENCY';

    case LogLevel.ERROR: // ERROR
      return 'ERROR';

    case LogLevel.WARNING: // WARNING
      return 'WARNING';

    case LogLevel.INFO: // INFO
      return 'INFO';

    case LogLevel.DEBUG: // DEBUG
      return 'DEBUG';

    // Everything else is INFO
    default:
      return 'INFO';
  }
}

/**
 * Add Label to cummulator if loggable type is Label
 *
 * @param cummulator 
 * @param input 
 * @returns 
 */
function setLabelFromLoggable(cummulator: TLabelKV, input: AbstractLoggable): boolean {
  if (input instanceof Label) {
    // TODO: remove in v0.5.0 of jlog-facade
    cummulator[input.key] = input.value as string;
    return true;
  } else {
    return false;
  }
}

/**
 * In case of error, the output `.message` needs to contain the stacktrace and `.log` needs to contain the message.
 * However, if the IJLogEntry's message is the same error.message, the `.log` entry is skipped.
 * 
 * @param input 
 * @param error 
 */
function appendErrorToGCloudOutput(input: IGCloudLogOutput, error?: Error): void {
  if (error) {
    // Build the message from error
    let message: string;

    if (error.stack) {
      message = error.stack;
    } else {
      message = error.message;
    }

    // Save the incoming message to be used later as .log
    const log = input.message;
    input.message = message;

    // Only set the log attribute if it's not the same as error message
    if (log !== error.message) {
      input.log = log;
    }
  }
}

/**
 * Format IJLogEntry to format required by Google Cloud
 *
 * @param entry 
 * @returns 
 */
export function formatGCloudLogOutput(entry: IJLogEntry): IGCloudLogOutput {
  const severity = levelToSeverity(entry.level);
  const message = entry.message;
  const time = entry.time.toISOString();

  const labels: TLabelKV = {};
  const loggables: AbstractLoggable[] = [];

  // Split entry.loggables to labels and loggables
  if (entry.loggables) {
    for (const loggable of entry.loggables) {
      // Set label
      if (setLabelFromLoggable(labels, loggable)) continue;

      // Add rest to others
      loggables.push(loggable);
    }
  }

  // Build the payload for the logger
  const payload = buildOutputDataForDestination(loggables, entry.data, entry.values);

  // Add logger name
  labels[GCLOUD_LOGGER_NAME_KEY] = entry.name;

  // Label must be added with a special key
  payload[GCLOUD_LABEL_KEY] = labels;

  // Payload should be unpacked for the response
  const output: IGCloudLogOutput = {
    severity,
    message,
    time,
    ...payload
  };

  appendErrorToGCloudOutput(output, entry.error);

  return output;
}

/**
 * Google Cloud Logging Destination
 */
export class GCloudDestination extends AbstractLogDestination{
  public static use(level?: string | LogLevel, ...filters: string[]): GCloudDestination {
    return useDestination(GCloudDestination, level, filters);
  }

  /**
   * A simple wrapper allow test to override this method
   * @param entry 
   * @returns 
   */
  protected formatOutput(entry: IJLogEntry): IGCloudLogOutput {
    return formatGCloudLogOutput(entry);
  }

  /**
   * Write formatted Google Cloud output to stdout
   * 
   * @param entry 
   */
  override write(entry: IJLogEntry): void {
    const output = this.formatOutput(entry);
    console.log(JSON.stringify(output));
  }
}





/*
## Target Output
{
  // These are primary log entries
  "severity": "INFO",
  "message": "saml attributes for xxx@example.com",
  "time": "2023-01-20T14:37:27.090338Z"

  // This is going to be translated into label
  "logging.googleapis.com/labels": {
    "loggerName": "it.diamantech.apm.saml.config.SAMLUserDetailsServiceImpl"
  },

  // Rest will be added to jsonPayload
  "abi": [
    "01234"
  ],
  "email": "xxx@example.com",
  "profilo": [
    "SUPERUSER"
  ],
  "Userid": "ABC123"
}


## SAMPLE Google Cloud LogEntry

{
  "insertId": "yk9q5xxgxusuuhrz",
  "jsonPayload": {
    "abi": [
      "01234"
    ],
    "message": "saml attributes for xxx@example.com",
    "email": "xxx@example.com",
    "profilo": [
      "SUPERUSER"
    ],
    "Userid": "ABC123"
  },
  "resource": {
    "type": "k8s_container",
    "labels": {
      "cluster_name": "prod-cluster-1",
      "container_name": "apm-saml",
      "project_id": "ex-ante-icb-prod",
      "namespace_name": "apm-prod",
      "pod_name": "apm-saml-6b87fd45f4-24fl5",
      "location": "europe-west3"
    }
  },
  "timestamp": "2023-01-20T14:37:27.090338Z",
  "severity": "INFO",
  "labels": {
    "k8s-pod/app_kubernetes_io/managed-by": "gcp-cloud-build-deploy",
    "compute.googleapis.com/resource_name": "gke-prod-cluster-1-apm-pool-d0cbface-qtco",
    "loggerName": "it.diamantech.apm.saml.config.SAMLUserDetailsServiceImpl",
    "k8s-pod/app": "apm-saml",
    "k8s-pod/pod-template-hash": "6b87fd45f4"
  },
  "logName": "projects/ex-ante-icb-prod/logs/stdout",
  "receiveTimestamp": "2023-01-20T14:37:31.274297792Z"
}
*/