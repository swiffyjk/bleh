function ff(flag) {
    log(`parsing ${flag}`, 'flag', 'log', {
        setting: settings.feature_flags[flag],
        sku: version.feature_flags[flag]
    });

    if (settings.feature_flags[flag] != null)
        return settings.feature_flags[flag];

    if (version.feature_flags[flag] != null)
        return version.feature_flags[flag].default;
}