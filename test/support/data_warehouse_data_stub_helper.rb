# frozen_string_literal: true

# rubocop:disable Metrics/ModuleLength
module DataWarehouseDataStubHelper
  NUM_RANDOM_BALANCE_DAYS = 30
  NUM_RANDOM_PROJECTION_DAYS = 6

  NUM_BALANCE_DAYS = 365
  NUM_PROJECTION_DAYS = 42

  AGGREGATION_WEEKLY = 7

  def sample_aggregated_accounts_insights_response(account_guids, last_transaction_date: nil)
    transaction_date = last_transaction_date.nil? ? (Time.now - rand(NUM_BALANCE_DAYS).days).to_date.to_s : last_transaction_date

    {
      data: {
        merchant: {
          aggregatedBankAccounts: {
            accountGuids: account_guids,
            aggregation: AGGREGATION_WEEKLY,
            currentBalance: rand(100_000),
            lastTransactionDate: transaction_date,
            averageDailyExpenses: rand(10_000),
            cashBufferDays: rand(70),
            balance: random_balances,
            projection: random_projections,
            performance: random_performance
          }
        }
      }
    }
  end

  def sample_empty_aggregated_accounts_insights_response(account_guids, last_transaction_date: nil)
    transaction_date = last_transaction_date.nil? ? (Time.now - rand(NUM_BALANCE_DAYS).days).to_date.to_s : last_transaction_date

    {
      data: {
        merchant: {
          aggregatedBankAccounts: {
            accountGuids: account_guids,
            aggregation: AGGREGATION_WEEKLY,
            currentBalance: rand(100_000),
            lastTransactionDate: transaction_date,
            averageDailyExpenses: rand(10_000),
            cashBufferDays: rand(70),
            balance: nil,
            projection: nil,
            performance: random_performance
          }
        }
      }
    }
  end

  private

  def random_balances
    balances = []

    NUM_RANDOM_BALANCE_DAYS.times do
      credits = rand(10_000)
      debits = rand(10_000)
      opening_balance = rand(100_000)

      ratio = credits.zero? ? nil : debits / credits

      balances << {
        date: (Time.now - rand(NUM_BALANCE_DAYS).days).to_date.to_s,
        credits: credits,
        debits: debits,
        operatingRatio: ratio,
        openingBalance: opening_balance
      }
    end

    balances
  end

  def random_projections
    projections = []

    NUM_RANDOM_PROJECTION_DAYS.times do
      credits = rand(10_000)
      debits = rand(10_000)

      opening_balance = rand(100_000)
      lo_balance = 0.9 * opening_balance
      hi_balance = 1.1 * opening_balance

      ratio = credits.zero? ? nil : debits / credits

      projections << {
        projectionId: SecureRandom.uuid,
        date: (Time.now + rand(NUM_PROJECTION_DAYS).days).to_date.to_s,
        credits: credits,
        debits: debits,
        operatingRatio: ratio,
        openingBalance: opening_balance,
        loBalance: lo_balance,
        hiBalance: hi_balance
      }
    end

    projections
  end

  def random_performance
    current_date = (Time.now - rand(NUM_BALANCE_DAYS).days).to_date
    previous_date = (current_date - 7.days).to_date

    current_balance = rand(100_000)
    previous_balance = rand(100_000)

    current_operating_ratio = rand
    previous_operating_ratio = rand

    balance_change = previous_balance.zero? ? nil : (current_balance - previous_balance) / previous_balance
    ratio_change = previous_operating_ratio.zero? ? nil : (current_operating_ratio - previous_operating_ratio) / previous_operating_ratio

    {
      currentDate: current_date.to_s,
      previousDate: previous_date.to_s,
      currentBalance: current_balance,
      previousBalance: previous_balance,
      currentOperatingRatio: current_operating_ratio,
      previousOperatingRatio: previous_operating_ratio,
      balanceChange: balance_change,
      operatingRatioChange: ratio_change
    }
  end
end
# rubocop:enable Metrics/ModuleLength
