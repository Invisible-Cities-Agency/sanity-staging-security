// This plugin is only compatible with Sanity Studio v3
// For more information, see https://github.com/sanity-io/incompatible-plugin

const {showIncompatiblePluginDialog} = require('@sanity/incompatible-plugin')

showIncompatiblePluginDialog({
  name: 'Staging Security Plugin',
  versions: {
    v3: '1.0.0',
  },
  sanityExchangeUrl: 'https://www.sanity.io/plugins/sanity-staging-security',
})