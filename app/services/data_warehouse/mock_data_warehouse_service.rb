# frozen_string_literal: true

class DataWarehouse::MockDataWarehouseService < DataWarehouse::DataWarehouseServiceBase
  include InsightsHelper

  def query_aggregated_accounts_insights(owner_guid, account_guids, aggregation: AGGREGATION_WEEKLY_INT)
    raise ConfigurationError unless Rails.configuration.mock_data_warehouse

    validate_integer_aggregation(aggregation)

    validate_account_guids(account_guids)

    # Seed the random generator with a consistent value for each merchant
    srand(Digest::SHA1.hexdigest(owner_guid).to_i(16))

    balance, closing_balance = generate_balance(aggregation)
    projection = generate_projection(aggregation, closing_balance)
    bank_account_info = {
      accountGuids: account_guids,
      aggregation: aggregation,
      currentBalance: rand * 100_000,
      lastTransactionDate: Time.now.to_date.to_s,
      averageDailyExpenses: rand * 10_000,
      cashBufferDays: rand * 100,
      balance: balance,
      projection: projection,
      performance: generate_performance(aggregation)
    }

    format_response({ aggregatedBankAccounts: bank_account_info }).with_indifferent_access
  end

  private

  def generate_balance(aggregation)
    generate_credits_debits(
      aggregation, rand * 100_000,
      (Time.now - 365.days).to_date,
      Time.now.to_date
    )
  end

  def generate_projection(aggregation, initial_balance)
    return [] unless rand > 0.2

    generate_credits_debits(
      aggregation,
      initial_balance,
      (Time.now + 1.day + 1.week).to_date,
      (Time.now + 1.day + 6.weeks).to_date
    ).first
  end

  def generate_performance(aggregation)
    period = aggregation

    current_balance = rand * 100_000
    previous_balance = rand * 100_000

    current_operating_ratio = rand
    previous_operating_ratio = rand

    {
      currentDate: Time.now.to_date.to_s,
      previousDate: (Time.now - period.days).to_date.to_s,
      currentBalance: current_balance,
      previousBalance: previous_balance,
      currentOperatingRatio: current_operating_ratio,
      previousOperatingRatio: previous_operating_ratio,
      balanceChange: if previous_balance.zero?
                       # :nocov:
                       nil
                       # :nocov:
                     else
                       (current_balance - previous_balance) / previous_balance
                     end,
      operatingRatioChange: if previous_operating_ratio.zero?
                              # :nocov:
                              nil
                              # :nocov:
                            else
                              (current_operating_ratio - previous_operating_ratio) /
                                previous_operating_ratio
                            end
    }
  end

  def generate_credits_debits(aggregation, initial_balance, start_date, end_date)
    balances = []
    period = aggregation
    running_balance = initial_balance
    current_date = start_date
    projection_id = SecureRandom.uuid

    while current_date <= end_date
      credits = rand * 1_000
      debits = rand * 1_000
      operating_ratio = debits / credits
      opening_balance = running_balance

      balances << {
        projectionId: projection_id,
        date: current_date.to_date.to_s,
        credits: credits,
        debits: debits,
        operatingRatio: operating_ratio,
        openingBalance: opening_balance,
        loBalance: 0.9 * opening_balance,
        hiBalance: 1.1 * opening_balance
      }.with_indifferent_access

      running_balance += credits - debits
      current_date += period.days
    end

    [balances.shuffle, running_balance]
  end
end
