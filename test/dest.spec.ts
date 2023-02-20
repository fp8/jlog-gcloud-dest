import { expect } from './testlib';

import {
    LoggerFactory, LogLevel, IJLogEntry,
    Label, KV, Tags
} from 'jlog-facade';

import {
    levelToSeverity, GCloudDestination,
    IGCloudLogOutput
} from '@fp8proj/dest';

let logCollector: Omit<IGCloudLogOutput, 'time'>[] = [];

class TestGCloudDestination extends GCloudDestination {
    override write(entry: IJLogEntry): void {
        const result = this.formatOutput(entry);
        console.log(JSON.stringify(result));

        // Delete the timestamp from collected log as it can't be tested
        const collect: Omit<IGCloudLogOutput, 'time'> = result;
        delete collect.time;
        logCollector.push(collect);
    }
}

describe('logger', () => {
    const logger = LoggerFactory.create('GLoggerTest');
    LoggerFactory.addLogDestination(new TestGCloudDestination(LogLevel.DEBUG));

    beforeEach(() => {
        logCollector = [];
    });

    it('levelToSeverity', () => {
        expect(levelToSeverity(LogLevel.PANIC)).to.eql('EMERGENCY');
        expect(levelToSeverity(LogLevel.ERROR)).to.eql('ERROR');

        expect(levelToSeverity(LogLevel.WARNING)).to.eql('WARNING');
        expect(levelToSeverity(400)).to.eql('WARNING');

        expect(levelToSeverity(LogLevel.INFO)).to.eql('INFO');
        expect(levelToSeverity(LogLevel.DEBUG)).to.eql('DEBUG');

        // Unexpected entries are all INFO
        expect(levelToSeverity(20)).to.eql('INFO');
        expect(levelToSeverity(10)).to.eql('INFO');
    });

    it('INFO log', () => {
        logger.info('This is info log for Zmx9IGaWWG');
        const expected = {
            severity: 'INFO',
            message: 'This is info log for Zmx9IGaWWG',
            'logging.googleapis.com/labels': { loggerName: 'GLoggerTest' }
        };
        
        // console.log(logCollector);
        expect(logCollector).to.eql([expected]);
    });

    it('WARN log with payload', () => {
        logger.warn('This is warning for ZMzVIFwXWA', {one: 'vHUyvEiYVv'});
        const expected = {
            severity: 'WARNING',
            message: 'This is warning for ZMzVIFwXWA',
            one: 'vHUyvEiYVv',
            'logging.googleapis.com/labels': { loggerName: 'GLoggerTest' }
        };
        
        // console.log(logCollector);
        expect(logCollector).to.eql([expected]);
    });

    it('DEBUG log with label', () => {
        logger.debug('EH9unhoeAd debugged', new Label('color', 'blue'));
        const expected = {
            severity: 'DEBUG',
            message: 'EH9unhoeAd debugged',
            'logging.googleapis.com/labels': {
                color: 'blue',
                loggerName: 'GLoggerTest'
            }
        };
        
        // console.log(logCollector);
        expect(logCollector).to.eql([expected]);
    });

    it('Error log with Tags', () => {
        const err = new Error('Madeup error for bcgR1zehRD');
        logger.error(err, Tags.of('os', 'mac', 'linux', 'win'));

        const expected = {
            severity: 'ERROR',
            message: err.stack,
            os: ['mac', 'linux', 'win'],
            'logging.googleapis.com/labels': {
                loggerName: 'GLoggerTest'
            }
        };
        
        // console.log(logCollector);
        expect(logCollector).to.eql([expected]);
    });

    it('Error log with Mesasge and KV', () => {
        const err = new Error('Ug7e0YpSNn is not correct');
        logger.error('Message for Ug7e0YpSNn', err, KV.of('version', 16));

        const expected = {
            severity: 'ERROR',
            log: 'Message for Ug7e0YpSNn',
            message: err.stack,
            version: 16,
            'logging.googleapis.com/labels': {
                loggerName: 'GLoggerTest'
            }
        };
        
        // console.log(logCollector);
        expect(logCollector).to.eql([expected]);
    });


    it('Panic log with everything', () => {
        const err = new Error('Panic error for OZKctzU91F');
        logger.panic(
            'OZKctzU91F means panic!',
            err,
            Label.of('color', 'purple'),
            Tags.of('os', 'Darwin', 'Windows'),
            KV.of('kv with label', new Label('weather', 'sunny'))
        );

        const expected = {
            severity: 'EMERGENCY',
            log: 'OZKctzU91F means panic!',
            message: err.stack,
            os: ['Darwin', 'Windows'],
            'kv with label': {
                weather: 'sunny'
            },
            'logging.googleapis.com/labels': {
                color: 'purple',
                loggerName: 'GLoggerTest'
            }
        };
        
        // console.log(logCollector);
        expect(logCollector).to.eql([expected]);
    });
});
