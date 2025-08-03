import {
  LoggerFactory,
  LogLevel,
  IJLogEntry,
  Label,
  KV,
  Tags,
} from "jlog-facade";

import {
  levelToSeverity,
  GCloudDestination,
  IGCloudLogOutput,
} from "@proj/dest";

let logCollector: Omit<IGCloudLogOutput, "time">[] = [];

class TestGCloudDestination extends GCloudDestination {
  override write(entry: IJLogEntry): void {
    const result = this.formatOutput(entry);
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(result));

    // Delete the timestamp from collected log as it can't be tested
    const collect: Omit<IGCloudLogOutput, "time"> = result;
    delete collect.time;
    logCollector.push(collect);
  }
}

describe("logger", () => {
  const logger = LoggerFactory.create("GLoggerTest");
  LoggerFactory.addLogDestination(new TestGCloudDestination(LogLevel.DEBUG));

  beforeEach(() => {
    logCollector = [];
  });

  it("levelToSeverity", () => {
    expect(levelToSeverity(LogLevel.PANIC)).toEqual("EMERGENCY");
    expect(levelToSeverity(LogLevel.ERROR)).toEqual("ERROR");

    expect(levelToSeverity(LogLevel.WARNING)).toEqual("WARNING");
    expect(levelToSeverity(400 as LogLevel)).toEqual("WARNING");

    expect(levelToSeverity(LogLevel.INFO)).toEqual("INFO");
    expect(levelToSeverity(LogLevel.DEBUG)).toEqual("DEBUG");

    // Unexpected entries are all INFO
    expect(levelToSeverity(20 as LogLevel)).toEqual("INFO");
    expect(levelToSeverity(10 as LogLevel)).toEqual("INFO");
  });

  it("INFO log", () => {
    logger.info("This is info log for Zmx9IGaWWG");
    const expected = {
      severity: "INFO",
      message: "This is info log for Zmx9IGaWWG",
      "logging.googleapis.com/labels": { loggerName: "GLoggerTest" },
    };

    // console.log(logCollector);
    expect(logCollector).toEqual([expected]);
  });

  it("WARN log with payload", () => {
    logger.warn("This is warning for ZMzVIFwXWA", { one: "vHUyvEiYVv" });
    const expected = {
      severity: "WARNING",
      message: "This is warning for ZMzVIFwXWA",
      one: "vHUyvEiYVv",
      "logging.googleapis.com/labels": { loggerName: "GLoggerTest" },
    };

    // console.log(logCollector);
    expect(logCollector).toEqual([expected]);
  });

  it("DEBUG log with label", () => {
    logger.debug("EH9unhoeAd debugged", new Label("color", "blue"));
    const expected = {
      severity: "DEBUG",
      message: "EH9unhoeAd debugged",
      "logging.googleapis.com/labels": {
        color: "blue",
        loggerName: "GLoggerTest",
      },
    };

    // console.log(logCollector);
    expect(logCollector).toEqual([expected]);
  });

  it("Error log with Tags", () => {
    const err = new Error("Madeup error for bcgR1zehRD");
    logger.error(err, Tags.of("os", "mac", "linux", "win"));

    const expected = {
      severity: "ERROR",
      message: err.stack,
      os: ["mac", "linux", "win"],
      "logging.googleapis.com/labels": {
        loggerName: "GLoggerTest",
      },
    };

    // console.log(logCollector);
    expect(logCollector).toEqual([expected]);
  });

  it("Error log with Mesasge and KV", () => {
    const err = new Error("Ug7e0YpSNn is not correct");
    logger.error("Message for Ug7e0YpSNn", err, KV.of("version", 16));

    const expected = {
      severity: "ERROR",
      log: "Message for Ug7e0YpSNn",
      message: err.stack,
      version: 16,
      "logging.googleapis.com/labels": {
        loggerName: "GLoggerTest",
      },
    };

    // console.log(logCollector);
    expect(logCollector).toEqual([expected]);
  });

  it("Panic log with everything", () => {
    const err = new Error("Panic error for OZKctzU91F");
    logger.panic(
      "OZKctzU91F means panic!",
      err,
      Label.of("color", "purple"),
      Tags.of("os", "Darwin", "Windows"),
      KV.of("kv with label", new Label("weather", "sunny")),
    );

    const expected = {
      severity: "EMERGENCY",
      log: "OZKctzU91F means panic!",
      message: err.stack,
      os: ["Darwin", "Windows"],
      "kv with label": {
        weather: "sunny",
      },
      "logging.googleapis.com/labels": {
        color: "purple",
        loggerName: "GLoggerTest",
      },
    };

    // console.log(logCollector);
    expect(logCollector).toEqual([expected]);
  });
});
