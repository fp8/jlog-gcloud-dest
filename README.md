# GLogger Destination

Google Cloud Logger destination for [jlog-facade](https://github.com/fp8/jlog-facade)

## Usage

```typescript
import {LoggerFactory} from 'jlog-facade';
import {GCloudDestination} from 'jlog-gcloud-dest';

LoggerFactory.addLogDestination(new GCloudDestination());
```
