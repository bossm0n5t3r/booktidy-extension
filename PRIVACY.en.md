# Privacy

Last updated: 2026-07-05

BookTidy stores data only in Firefox `browser.storage.local`. BookTidy does not send data to any external server.

## Data stored by BookTidy

BookTidy stores only the following data.

- Publisher filter rules entered by the user and internal metadata for those rules.
- Author filter rules entered by the user and internal metadata for those rules.
- Title filter rules entered by the user and internal metadata for those rules.
- Whether BookTidy is enabled or disabled.
- Popup theme setting (`light` or `dark`).
- Internal storage schema version.

Rule metadata may include a rule identifier, whether the rule is enabled, the matching method, creation time, and modification time.

## Data BookTidy does not collect

BookTidy does not collect, store, or transmit the following data.

- Search queries.
- Browsing history.
- Purchase history.
- Account information.
- Personally identifiable information.
- Full page HTML.
- Analytics or telemetry data.

## Network transmission

BookTidy does not use a server API, analytics, remote synchronization, or external data transmission. Your rules and settings remain in your Firefox local extension storage.

## Permission usage

- `storage`: Used to save and load the filter rules and settings entered by the user in Firefox local extension storage.
- `tabs`: Used only by the popup's current page refresh button to find and reload the currently active tab.
- Host permissions: Used on supported book search result pages to read book item information such as title, publisher, and author, and compare it against the user's local rules.
- `booktidy-icon.svg` web-accessible resource: Used to display the BookTidy extension icon in the BookTidy UI shown on supported pages.

BookTidy does not modify your account, purchase history, recommendations, or any remote website data.
