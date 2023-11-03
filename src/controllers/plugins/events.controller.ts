import { Colors, CommandInteraction } from 'discord.js'
import { Hans } from '../..'
import { generateCalendarLinks } from '../../utils/calendar-links'

export const getUserEvents = async (interaction: CommandInteraction) => {
  try {
    const author = interaction.user

    const guildEvents = Hans.guilds.cache
      .get(interaction.guildId)
      .scheduledEvents.cache.map((event) => event)

    if (!guildEvents.length)
      return interaction.editReply({
        embeds: [
          {
            title: '🗓️ Event Calendar Links',
            description: `
          ${author.displayName}, you have no events scheduled.
          `,
            color: Colors.Aqua,
          },
        ],
      })

    const event = await Promise.all(
      guildEvents.map(async (event) => {
        // INFO: If event is not active and has no subscribers, don't show it
        if (!event && !event.isActive && event.userCount <= 0) return

        return await event.fetchSubscribers().then((subscribers) => {
          return {
            ...event,
            subscribers: subscribers.map((subscriber) => subscriber.user.id),
          }
        })
      }),
    )

    const subscribedEvents = event.filter((e) => e.subscribers.includes(author.id))

    const links: {
      name: string
      value: string[]
    }[] = []

    subscribedEvents.forEach((_event) => {
      const event = guildEvents.find((e) => e.id === _event.id)
      const googleLink = generateCalendarLinks(event, 'google')
      const outlookLink = generateCalendarLinks(event, 'outlook')

      links.push({
        name: event.name,
        value: [googleLink, outlookLink],
      })
    })

    return interaction.editReply({
      embeds: [
        {
          title: '🗓️ Event Calendar Links',
          description: `
          ${author.displayName}, your following events are scheduled:

          ${links
            .map((link, i) => {
              return `${i + 1}: **${link.name} ** ∫ [Google](${link.value[0]}) ⊙ [Outlook](${
                link.value[1]
              })`
            })
            .join('\n')}
          `,
          color: Colors.Aqua,
        },
      ],
    })
  } catch (error) {
    console.error('❌ ERROR: getUserEvents(): ', error)
  }
}
