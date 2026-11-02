# Privacy, for the team

The short version users see is on the app's Privacy page. This is what the code really does. Anything that adds server data must update this file in the same change.

## On the device only

Profile, plan, read and seen alerts, steps done, follows, receipts, reporter key.

## On the server

| Data | Why | How long |
|---|---|---|
| Push address and keys, country, types of money | Deliver alerts to the right devices | Until alarms are off, or the device expires |
| Delivery row | Send and remind | Until seen or finished |
| Report text, links, date, receipt hash, reporter key if named | Review reports | Kept. Delete old rejected reports regularly |
| Reporter name, public key, track record, proof link | Public reputation | Until they ask to remove it |
| Agent token hash, address, country, types of money | Tell agents | Until disconnected |
| Published alerts | The public record | Kept |
| Admin audit log | Accountability | Kept |

## Never stored

Names of anonymous reporters, email, phone, balances, wallet addresses, how someone earns, or IP addresses in our database.

## Rules

- No analytics or trackers.
- Fonts ship with the app, so users never contact Google for them.
- Reports store a date, not a time, so they are harder to link to a person.
- Follows stay on the device.

## Outside our control

Hosting and CDN logs can hold IP addresses, so turn logs down and keep them short. Push services can see that a device received a push. Reporter proof links are only shown to admins.
