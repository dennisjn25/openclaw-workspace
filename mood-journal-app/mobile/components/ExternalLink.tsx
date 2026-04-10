import { Link } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import { Platform } from 'react-native';

type ExternalLinkProps = Omit<React.ComponentProps<typeof Link>, 'href'> & { href: string };

export function ExternalLink(props: ExternalLinkProps) {
  return (
    <Link
      target="_blank"
      {...props}
      // @ts-expect-error - external URLs are not typed in expo-router
      href={props.href}
      onPress={(e) => {
        if (Platform.OS !== 'web') {
          e.preventDefault();
          WebBrowser.openBrowserAsync(props.href);
        }
      }}
    />
  );
}